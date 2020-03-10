const assert = require('assert');
const { Tezos } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const BigNumber = require("bignumber.js");
const fetch = require("node-fetch");

const contractDeploy = require('../deployed/fa12_latest.json');
const faucet = require('../faucetA.json');

const { email, password, mnemonic , secret } = faucet;
const signer = InMemorySigner.fromFundraiser(email,password, mnemonic.join(' '));
Tezos.setProvider({ rpc: 'https://api.tez.ie/rpc/babylonnet', signer });

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
    const signerAccount = await Tezos.signer.publicKeyHash();
    const initialStorage = await getStorage(contractAddress, [signerAccount]);
    const initialBalance = initialStorage.accounts[signerAccount].balance;

    const value = '10';

    // When
    const op = await contract.methods.mint(value).send();
    await op.confirmation();

    // Then
    const storageAfter = await getStorage(contractAddress, [signerAccount]);
    const balanceAfter = storageAfter.accounts[signerAccount].balance;

    assert(initialBalance.plus(value).toString(), balanceAfter.toString(), 'Balance plus value should be equal to balance after mint.');
    assert(initialStorage.totalSupply.plus(value).toString(), storageAfter.totalSupply.toString(), 'TotalSupply should be the same.');
    console.log(`[OK] Mint. Total suppĺy: ${storageAfter.totalSupply.toString()} - Balance ${signerAccount}: ${balanceAfter.toString()}`);
};

const test = async () => {
    const tests = [
      testMethods, 
      testMint,
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