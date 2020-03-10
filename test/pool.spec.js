const assert = require('assert');
const { Tezos } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const BigNumber = require("bignumber.js");
const fetch = require("node-fetch");

const utils = require('./utils');
const { tokenAmountInUnits, unitsInTokenAmount} = utils;

const contractDeploy = require('../deployed/pool_latest.json');
const faucetA = require('../faucetA.json');
const faucetB = require('../faucetB.json');

const signerFaucetA = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));
const signerFaucetB = InMemorySigner.fromFundraiser(faucetB.email, faucetB.password, faucetB.mnemonic.join(' '));

const rpc = 'https://api.tez.ie/rpc/babylonnet';
//const rpc = 'https://rpctest.tzbeta.net';

Tezos.setProvider({ rpc, signer: signerFaucetA });

const getStorage = async (address, keys) => {
    const contract = await Tezos.contract.at(address);
    const storage = await contract.storage();
    const deposits = await keys.reduce(async (prev, current) => {
      const value = await prev;
  
      let entry = {
        tezAmount: 0,
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
    const methodsThatMustExist = ['withdraw', 'updateExchangeRate', 'deposit'];
    
    //Then
    assert(methodsKeys.length === methodsThatMustExist.length, "Some methods doesn't exist");
    console.log(`[OK] Methods: ${methodsThatMustExist.join(', ')}.`)
};

const test = async () => {
    const tests = [
      testMethods,
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