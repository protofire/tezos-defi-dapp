const assert = require('assert');
const { Tezos, UnitValue } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const BigNumber = require("bignumber.js");

const utils = require('./utils');
const { tokenAmountInUnits, unitsInTokenAmount, tzFormatter} = utils;

const contractDeploy = require('../deployed/pool_latest.json');
const faucetA = require('../faucetA.json');
const faucetB = require('../faucetB.json');

const signerFaucetA = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));
const signerFaucetB = InMemorySigner.fromFundraiser(faucetB.email, faucetB.password, faucetB.mnemonic.join(' '));

const rpc = contractDeploy.network;

Tezos.setProvider({ rpc, signer: signerFaucetA });

const getStorage = async (address, keys) => {
    const contract = await Tezos.contract.at(address);
    const storage = await contract.storage();
    const deposits = await keys.reduce(async (prev, current) => {
      const value = await prev;
  
      let entry = {
        tezAmount: new BigNumber(0),
        blockTimestamp: null,
      };
  
      try {
        entry = await storage.deposits.get(current);
      } catch (err) {
        // Do nothing
      }
  
      return {
        ...value,
        [current]: entry
      };
    }, Promise.resolve({}));
    return {
      ...storage,
      deposits
    };
  };

const testMethods = async () => {
    // Given
    const fa12Contract = await Tezos.contract.at(contractDeploy.address);
    const methods = fa12Contract.methods;

    // When
    const methodsKeys = Object.keys(methods);
    const methodsThatMustExist = ['withdraw', 'updateExchangeRate',  'addLiquidity', 'deposit'];
    
    //Then
    assert(methodsKeys.length === methodsThatMustExist.length, "Some methods doesn't exist");
    console.log(`[OK] Methods: ${methodsThatMustExist.join(', ')}.`)
};

const testCheckLiquidity =  async () => {
  // Given
  const contractAddress = contractDeploy.address;
  const accountFaucetA = await signerFaucetA.publicKeyHash();
  const accountFaucetB = await signerFaucetB.publicKeyHash();

  // When
  const initialStorage = await getStorage(contractAddress, [accountFaucetA, accountFaucetB]);

  // Then
  assert(initialStorage.liquidity.isGreaterThan(new BigNumber(0)), 'Liquidity must be greater than zero');
  console.log(`[OK] Liquidity: pool have an amount of ${tzFormatter(initialStorage.liquidity, 'tz')}.`)
};

const testDeposit =  async () => {
  // Given
  const contractAddress = contractDeploy.address;
  Tezos.setProvider({ rpc, signer: signerFaucetA });

  const contract = await Tezos.contract.at(contractAddress);
  const accountFaucetA = await signerFaucetA.publicKeyHash();
  const accountFaucetB = await signerFaucetB.publicKeyHash();
  const accountFaucetAInitialBalance = await Tezos.tz.getBalance(accountFaucetA)

  const value = 1; // Send 1 tez

  const initialStorage = await getStorage(contractAddress, [accountFaucetA, accountFaucetB]);
  const initialDepositBalance = initialStorage.deposits[accountFaucetA].tezAmount;

  // When
  const op = await contract.methods.deposit(UnitValue).send({ amount: value });
  await op.confirmation();

  // Then
  const storageAfter = await getStorage(contractAddress, [accountFaucetA, accountFaucetB]);
  const afterDepositBalance = storageAfter.deposits[accountFaucetA].tezAmount;
  const afterLiquidity = storageAfter.liquidity;
  const accountFaucetAAfterBalance = await Tezos.tz.getBalance(accountFaucetA)

  assert(afterDepositBalance.isGreaterThan(initialDepositBalance), 'Deposit should be updated');
  console.log(`[OK] Deposit: user made a deposit of ${value} tz. 
  Liquidity: ${tzFormatter(afterLiquidity, 'tz')}.
  Initial account ${accountFaucetA} balance: ${tzFormatter(accountFaucetAInitialBalance, 'tz')}. After account ${accountFaucetA} balance: ${tzFormatter(accountFaucetAAfterBalance, 'tz')}.
  Initial balance:  ${tzFormatter(initialDepositBalance, 'tz')}. After balance: ${tzFormatter(afterDepositBalance, 'tz')}.`)
};

const testWithdraw = async() => {
    // Given
    const contractAddress = contractDeploy.address;
    Tezos.setProvider({ rpc, signer: signerFaucetA });
  
    const contract = await Tezos.contract.at(contractAddress);
    const accountFaucetA = await signerFaucetA.publicKeyHash();
    const accountFaucetB = await signerFaucetB.publicKeyHash();
    const accountFaucetAInitialBalance = await Tezos.tz.getBalance(accountFaucetA)
  
    const initialStorage = await getStorage(contractAddress, [accountFaucetA, accountFaucetB]);
    const initialDepositBalance = initialStorage.deposits[accountFaucetA].tezAmount;
  
    // When
    const op = await contract.methods.withdraw(UnitValue).send();
    await op.confirmation();
  
    // Then
    const storageAfter = await getStorage(contractAddress, [accountFaucetA, accountFaucetB]);
    const afterDepositBalance = storageAfter.deposits[accountFaucetA].tezAmount;
    const afterLiquidity = storageAfter.liquidity;
    const accountFaucetAAfterBalance = await Tezos.tz.getBalance(accountFaucetA)

    assert(accountFaucetAAfterBalance.isGreaterThan(accountFaucetAInitialBalance) && afterDepositBalance.isZero(), 'Deposit should be updated');
    console.log(`[OK] Withdraw: user made a withdraw. 
    Liquidity: ${tzFormatter(afterLiquidity, 'tz')}.
    Initial account ${accountFaucetA} balance: ${tzFormatter(accountFaucetAInitialBalance, 'tz')}. After account ${accountFaucetA} balance: ${tzFormatter(accountFaucetAAfterBalance, 'tz')}.
    Initial balance:  ${tzFormatter(initialDepositBalance, 'tz')}. After balance: ${tzFormatter(afterDepositBalance, 'tz')}.`)
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
    console.error(e)
});