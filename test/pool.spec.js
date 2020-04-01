const assert = require('assert');
const { Tezos, UnitValue } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const BigNumber = require("bignumber.js");

const { tzFormatter, getPoolStorage } = require('./utils');

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
      'withdraw',
      'updateTokenDecimals',
      'updateTokenAddress',
      'updateExchangeRatio',
      'updateCollateralRatio',
      'getExchangeRatio',
      'getBalanceOf',
      'deposit',
      'addLiquidity'
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

  const value = 1; // Send 1 tez

  const initialPoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);

  const initialDepositBalance = initialPoolStorage.deposits[accountFaucetA].tezAmount;

  // When
  const operationAddOwner = await contractToken.methods.addOwner(contractPoolAddress).send();
  await operationAddOwner.confirmation();

  const operationDeposit = await contractPool.methods.deposit(UnitValue).send({ amount: value });
  await operationDeposit.confirmation();

  // Then
  const storageAfter = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
  const afterDepositBalance = storageAfter.deposits[accountFaucetA].tezAmount;

  assert(afterDepositBalance.isGreaterThan(initialDepositBalance), 'Deposit should be updated');
  console.log(`[OK] Deposit: user made a deposit of ${value} tz.`)
};

const testWithdraw = async() => {
    // Given
    const contractAddress = contractPoolDeploy.address;
    Tezos.setProvider({ rpc, signer: signerFaucetA });
  
    const contract = await Tezos.contract.at(contractAddress);
    const accountFaucetA = await signerFaucetA.publicKeyHash();
    const accountFaucetB = await signerFaucetB.publicKeyHash();
    const accountFaucetAInitialBalance = await Tezos.tz.getBalance(accountFaucetA)
    const amountToWithdraw = 1;

    // When
    const operationWithdraw = await contract.methods.withdraw(amountToWithdraw).send();
    await operationWithdraw.confirmation();
  
    // Then
    const storageAfter = await getPoolStorage(contractAddress, [accountFaucetA, accountFaucetB]);
    const afterDepositBalance = storageAfter.deposits[accountFaucetA].tezAmount;
    const accountFaucetAAfterBalance = await Tezos.tz.getBalance(accountFaucetA)

    assert(accountFaucetAAfterBalance.isGreaterThan(accountFaucetAInitialBalance) && afterDepositBalance.isZero(), 'Deposit should be updated');
    console.log(`[OK] Withdraw: user made a withdraw and have ${tzFormatter(accountFaucetAAfterBalance, 'tz')}.`)
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
    }
};
  
(async () => {
    await test();
})().catch(e => {
    console.error(e);
    process.exit(1);
});