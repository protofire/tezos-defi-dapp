const assert = require('assert');
const { Tezos, UnitValue } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const BigNumber = require("bignumber.js");

const { tzFormatter, getPoolStorage, getTokenStorage, tokenAmountInUnits } = require('./utils');

const contractPoolDeploy = require('../deployed/pool_latest.json');
const contractTokenDeploy = require('../deployed/fa12_latest.json');

const faucetA = require('../faucetA.json');
const faucetB = require('../faucetB.json');

const signerFaucetA = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));
const signerFaucetB = InMemorySigner.fromFundraiser(faucetB.email, faucetB.password, faucetB.mnemonic.join(' '));

const rpc = contractPoolDeploy.network;

const testMethods = async () => {
    // Given
    Tezos.setProvider({ rpc, signer: signerFaucetA });
    const fa12Contract = await Tezos.contract.at(contractPoolDeploy.address);
    const methods = fa12Contract.methods;

    // When
    const methodsKeys = Object.keys(methods);
    const methodsThatMustExist = [
      'deposit',
      'withdraw',
      'borrow',
      'repayBorrow',
      'updateCollateralRate',
      'addLiquidity',
      'getExchangeRate',
      'getBalanceOf',
    ];

    //Then
    assert(methodsKeys.length === methodsThatMustExist.length, "Some methods doesn't exist");
    console.log(`[OK] Methods: ${methodsThatMustExist.join(', ')}.`)
};

const testCheckLiquidity =  async () => {
  // Given
  Tezos.setProvider({ rpc, signer: signerFaucetA });
  const contractAddress = contractPoolDeploy.address;
  const accountFaucetA = await signerFaucetA.publicKeyHash();
  const accountFaucetB = await signerFaucetB.publicKeyHash();

  // When
  const initialStorage = await getPoolStorage(contractAddress, [accountFaucetA, accountFaucetB]);

  // Then
  assert(initialStorage.liquidity.isGreaterThan(new BigNumber(0)), 'Liquidity must be greater than zero');
  console.log(`[OK] Liquidity: pool have an amount of ${tzFormatter(initialStorage.liquidity, 'tz')}.`)
};

const testDeposit =  async () => {
  // Given
  const contractPoolAddress = contractPoolDeploy.address;
  const contractTokenAddress = contractTokenDeploy.address;

  Tezos.setProvider({ rpc, signer: signerFaucetA });

  const contractPool = await Tezos.contract.at(contractPoolAddress);
  const contractToken = await Tezos.contract.at(contractTokenAddress);

  const accountFaucetA = await signerFaucetA.publicKeyHash();
  const accountFaucetB = await signerFaucetB.publicKeyHash();

  const value = 2; // Send 1 tez

  const beforePoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
  const beforeTokenStorage = await getTokenStorage(contractTokenAddress, [accountFaucetA, accountFaucetB]);

  const beforeDepositBalance = beforePoolStorage.deposits[accountFaucetA].tezAmount;
  const beforeTokenBalance = beforeTokenStorage.accounts[accountFaucetA].balance;

  // When
  const operationAddOwner = await contractToken.methods.addOwner(contractPoolAddress).send();
  await operationAddOwner.confirmation();

  const operationDeposit = await contractPool.methods.deposit(UnitValue).send({ amount: value });
  await operationDeposit.confirmation();

  // Then
  const afterPoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
  const afterTokenStorage = await getTokenStorage(contractTokenAddress, [accountFaucetA, accountFaucetB]);

  const afterDepositBalance = afterPoolStorage.deposits[accountFaucetA].tezAmount;
  const afterTokenBalance = afterTokenStorage.accounts[accountFaucetA].balance;

  assert(afterDepositBalance.isGreaterThan(beforeDepositBalance), 'Pool deposit should be increased');
  assert(afterPoolStorage.token.tokenSupply.isGreaterThan(beforePoolStorage.token.tokenSupply), 'Token supply should be increased');
  assert(afterPoolStorage.totalDeposits.isGreaterThan(beforePoolStorage.totalDeposits), 'Token deposit should be increased');

  console.log(`[OK] Deposit: user made a deposit of ${value} tz. Minted an amount of ${tokenAmountInUnits(afterTokenBalance, afterTokenStorage.decimals.toString())} ${afterTokenStorage.symbol}`)
};

const testWithdraw = async() => {
    // Given
    const contractPoolAddress = contractPoolDeploy.address;
    const contractTokenAddress = contractTokenDeploy.address;
  
    Tezos.setProvider({ rpc, signer: signerFaucetA });
  
    const contractPool = await Tezos.contract.at(contractPoolAddress);
    const contractToken = await Tezos.contract.at(contractTokenAddress);
  
    const accountFaucetA = await signerFaucetA.publicKeyHash();
    const accountFaucetB = await signerFaucetB.publicKeyHash();
    const beforeBalance = await Tezos.tz.getBalance(accountFaucetA);
    const amountToWithdraw = 1;

    const beforePoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
    const beforeTokenStorage = await getTokenStorage(contractTokenAddress, [accountFaucetA, accountFaucetB]);

    const beforeDepositBalance = beforePoolStorage.deposits[accountFaucetA].tezAmount;
    const beforeTokenBalance = beforeTokenStorage.accounts[accountFaucetA].balance;
  
    // When
    const operationAddOwner = await contractToken.methods.addOwner(contractPoolAddress).send();
    await operationAddOwner.confirmation();

    const operationWithdraw = await contractPool.methods.withdraw(amountToWithdraw).send();
    await operationWithdraw.confirmation();
  
    // Then
    const afterPoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
    const afterTokenStorage = await getTokenStorage(contractTokenAddress, [accountFaucetA, accountFaucetB]);
    const afterBalance = await Tezos.tz.getBalance(accountFaucetA);

    const afterDepositBalance = afterPoolStorage.deposits[accountFaucetA].tezAmount;
    const afterTokenBalance = afterTokenStorage.accounts[accountFaucetA].balance;

    assert(afterBalance.isGreaterThan(beforeBalance), 'Balance should be increased');
    assert(afterDepositBalance.isLessThan(beforeDepositBalance), 'Pool deposit should be decreased');
    assert(afterPoolStorage.token.tokenSupply.isLessThan(beforePoolStorage.token.tokenSupply), 'Token supply should be decreased');
    assert(afterPoolStorage.totalDeposits.isLessThan(beforePoolStorage.totalDeposits), 'Token deposit should be decreased');
  
    console.log(`[OK] Withdraw: user made a withdraw and have ${tzFormatter(afterBalance, 'tz')}.`)
}

const test = async () => {
    const tests = [
      testMethods,
      testCheckLiquidity,
      testDeposit,
      testWithdraw,
    ];

    for (let test of tests) {
      await test();
     // await new Promise(r => setTimeout(r, 5000));
    }
};
  
(async () => {
    await test();
})().catch(e => {
    console.error(e);
    process.exit(1);
});