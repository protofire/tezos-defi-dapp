const assert = require('assert');
const { Tezos } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const BigNumber = require("bignumber.js");
const fetch = require("node-fetch");

const contractDeploy = require('../deployed/fa12_latest.json');
const faucetA = require('../faucetA.json');
const faucetB = require('../faucetB.json');

const signerFaucetA = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));
const signerFaucetB = InMemorySigner.fromFundraiser(faucetB.email, faucetB.password, faucetB.mnemonic.join(' '));
Tezos.setProvider({ rpc: 'https://api.tez.ie/rpc/babylonnet', signer: signerFaucetA });

const getStorage = async (address, keys) => {
    const contract = await Tezos.contract.at(address);
    const storage = await contract.storage();
    const accounts = await keys.reduce(async (prev, current) => {
      const value = await prev;
  
      let entry = {
        balance: new BigNumber(0),
        allowances: {},
      };
  
      try {
        entry = await storage.accounts.get(current);
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
      accounts
    };
  };

const testMethods = async () => {
    // Given
    const fa12Contract = await Tezos.contract.at(contractDeploy.address);
    const methods = fa12Contract.methods;

    // When
    const methodsKeys = Object.keys(methods);
    const methodsThatMustExist = ['transfer', 'mint', 'getTotalSupply', 'getBalance', 'getAllowance', 'burn', 'approve'];
    
    //Then
    assert(methodsKeys.length === methodsThatMustExist.length, "Some methods doesn't exist");
    console.log(`[OK] Methods: ${methodsThatMustExist.join(', ')}`)
};

const testMint =  async () => {
    // Given
    const contractAddress = contractDeploy.address;
    const contract = await Tezos.contract.at(contractAddress);
    const accountFaucetA = await signerFaucetA.publicKeyHash();
    const accountFaucetB = await signerFaucetB.publicKeyHash();

    const initialStorage = await getStorage(contractAddress, [accountFaucetA, accountFaucetB]);
    const initialFaucetABalance = initialStorage.accounts[accountFaucetA].balance;

    const value = '20';

    // When
    const op = await contract.methods.mint(value).send();
    await op.confirmation();

    // Then
    const storageAfter = await getStorage(contractAddress, [accountFaucetA, accountFaucetB]);
    const balanceFaucetAAfter = storageAfter.accounts[accountFaucetA].balance;
    const balanceFaucetBAfter = storageAfter.accounts[accountFaucetB].balance;

    assert(initialFaucetABalance.plus(value).toString(), balanceFaucetAAfter.toString(), 'Balance plus value should be equal to balance after mint.');
    assert(initialStorage.totalSupply.plus(value).toString(), storageAfter.totalSupply.toString(), 'TotalSupply should be the same.');
    console.log(`[OK] Mint, check supply and account balance. 
    Total suppĺy: ${storageAfter.totalSupply.toString()}.
    Balance ${accountFaucetA}: ${balanceFaucetAAfter.toString()}.
    Balance ${accountFaucetB}: ${balanceFaucetBAfter.toString()}.`);
};


const testTransfer =  async () => {
  // Given
  const contractAddress = contractDeploy.address;
  const contract = await Tezos.contract.at(contractAddress);
  const accountFaucetA = await signerFaucetA.publicKeyHash();
  const accountFaucetB = await signerFaucetB.publicKeyHash();

  const initialStorage = await getStorage(contractAddress, [accountFaucetA, accountFaucetB]);
  const initialAccountFaucetABalance = initialStorage.accounts[accountFaucetA].balance;
  const initialAccountFaucetBBalance = initialStorage.accounts[accountFaucetB].balance;

  const value = '20';

  // When
  const op = await contract.methods.transfer(accountFaucetA, accountFaucetB, value).send();
  await op.confirmation();

  // Then
  const storageAfter = await getStorage(contractAddress, [accountFaucetA, accountFaucetB]);
  const balanceAccountFaucetAAfter = storageAfter.accounts[accountFaucetA].balance;
  const balanceAccountFaucetBAfter = storageAfter.accounts[accountFaucetB].balance;

  assert(initialAccountFaucetABalance.minus(value).toString(), balanceAccountFaucetAAfter.toString(), 'Balance minus value should be equal to balance after transfer for account A.');
  assert(initialAccountFaucetBBalance.plus(value).toString(), balanceAccountFaucetBAfter.toString(), 'Balance plus value should be equal to balance after transfer for account B.');

  console.log(`[OK] Transfer amount of ${value} from ${accountFaucetA} to ${accountFaucetB}. 
  Account: ${accountFaucetA} - Initial balance: ${initialAccountFaucetABalance.toString()} - Balance after: ${balanceAccountFaucetAAfter}.
  Account: ${accountFaucetB} - Initial balance: ${initialAccountFaucetBBalance.toString()} - Balance after: ${balanceAccountFaucetBAfter}.`);
};

const test = async () => {
    const tests = [
      testMethods, 
      testMint,
      testTransfer,
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