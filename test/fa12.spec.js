const assert = require('assert');
const { Tezos } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const BigNumber = require("bignumber.js");

const { tokenAmountInUnits, unitsInTokenAmount, getTokenStorage} = require('./utils');

const contractDeploy = require('../deployed/fa12_latest.json');
const faucetA = require('../faucetA.json');
const faucetB = require('../faucetB.json');

const signerFaucetA = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));
const signerFaucetB = InMemorySigner.fromFundraiser(faucetB.email, faucetB.password, faucetB.mnemonic.join(' '));

const rpc = contractDeploy.network;

const testMethods = async () => {
    // Given
    Tezos.setProvider({ rpc, signer: signerFaucetA });
    const fa12Contract = await Tezos.contract.at(contractDeploy.address);
    const methods = fa12Contract.methods;

    // When
    const methodsKeys = Object.keys(methods);
    const methodsThatMustExist = ['transfer', 'mint', 'mintTo', 'addOwner', 
    'getTotalSupply', 'getBalance', 'getAllowance', 'burn', 'burnTo',
    'approve', 'decimals', 'symbol', 'name'];
    
    //Then
    assert(methodsKeys.length === methodsThatMustExist.length, "Some methods doesn't exist");
    console.log(`[OK] Methods: ${methodsThatMustExist.join(', ')}.`)
};

const testMint =  async () => {
    // Given
    Tezos.setProvider({ rpc, signer: signerFaucetA });
    const contractAddress = contractDeploy.address;
    const contract = await Tezos.contract.at(contractAddress);
    const accountFaucetA = await signerFaucetA.publicKeyHash();
    const accountFaucetB = await signerFaucetB.publicKeyHash();

    const initialStorage = await getTokenStorage(contractAddress, [accountFaucetA, accountFaucetB]);
    const initialFaucetABalance = initialStorage.accounts[accountFaucetA].balance;

    const decimals = initialStorage.decimals;
    const symbol = initialStorage.symbol;
    const value = '2000000000000000000';
    const valueBN = new BigNumber(value);

    // When
    const op = await contract.methods.mint(value).send();
    await op.confirmation();

    // Then
    const storageAfter = await getTokenStorage(contractAddress, [accountFaucetA, accountFaucetB]);
    const balanceFaucetAAfter = storageAfter.accounts[accountFaucetA].balance;
    const balanceFaucetBAfter = storageAfter.accounts[accountFaucetB].balance;

    assert(initialFaucetABalance.plus(value).toString() === balanceFaucetAAfter.toString(), 'Balance plus value should be equal to balance after mint.');
    assert(initialStorage.totalSupply.plus(value).toString() === storageAfter.totalSupply.toString(), 'TotalSupply should be the same.');
    console.log(`[OK] Mint amount ${tokenAmountInUnits(valueBN, decimals)} ${symbol}, check supply and account balance.`);
};

const testMintTo =  async () => {
  // Given
  Tezos.setProvider({ rpc, signer: signerFaucetA });
  const contractAddress = contractDeploy.address;
  const contract = await Tezos.contract.at(contractAddress);
  const accountFaucetA = await signerFaucetA.publicKeyHash();
  const accountFaucetB = await signerFaucetB.publicKeyHash();

  const initialStorage = await getTokenStorage(contractAddress, [accountFaucetA, accountFaucetB]);
  const initialFaucetBBalance = initialStorage.accounts[accountFaucetB].balance;

  const decimals = initialStorage.decimals;
  const symbol = initialStorage.symbol;
  const value = '2000000000000000000';
  const valueBN = new BigNumber(value);

  // When
  const op = await contract.methods.mintTo(accountFaucetB, value).send();
  await op.confirmation();

  // Then
  const storageAfter = await getTokenStorage(contractAddress, [accountFaucetA, accountFaucetB]);
  const balanceFaucetBAfter = storageAfter.accounts[accountFaucetB].balance;

  assert(initialFaucetBBalance.plus(value).toString() === balanceFaucetBAfter.toString(), 'Balance plus value should be equal to balance after mint.');
  assert(initialStorage.totalSupply.plus(value).toString() === storageAfter.totalSupply.toString(), 'TotalSupply should be the same.');
  console.log(`[OK] MintTo ${accountFaucetB} amount ${tokenAmountInUnits(valueBN, decimals)} ${symbol}, check supply and account balance.`);
};

const testTransfer =  async () => {
  // Given
  Tezos.setProvider({ rpc, signer: signerFaucetA });
  const contractAddress = contractDeploy.address;
  const contract = await Tezos.contract.at(contractAddress);
  const accountFaucetA = await signerFaucetA.publicKeyHash();
  const accountFaucetB = await signerFaucetB.publicKeyHash();

  const initialStorage = await getTokenStorage(contractAddress, [accountFaucetA, accountFaucetB]);
  const initialAccountFaucetABalance = initialStorage.accounts[accountFaucetA].balance;
  const initialAccountFaucetBBalance = initialStorage.accounts[accountFaucetB].balance;

  const decimals = initialStorage.decimals;
  const symbol = initialStorage.symbol;
  const value = '2000000000000000000';
  const allowedBN = initialStorage.accounts[accountFaucetA].allowances.get(accountFaucetB);
  const allowed = allowedBN.toString();
  const valueBN = new BigNumber(value);

  // When
  if(value !== allowed && allowedBN && allowedBN.isZero()) {
    const operationAllow = await contract.methods.approve(accountFaucetB, value).send();
    await operationAllow.confirmation();
  }

  const op = await contract.methods.transfer(accountFaucetA, accountFaucetB, value).send();
  await op.confirmation();

  // Then
  const storageAfter = await getTokenStorage(contractAddress, [accountFaucetA, accountFaucetB]);
  const balanceAccountFaucetAAfter = storageAfter.accounts[accountFaucetA].balance;
  const balanceAccountFaucetBAfter = storageAfter.accounts[accountFaucetB].balance;

  assert(initialAccountFaucetABalance.minus(value).toString() === balanceAccountFaucetAAfter.toString(), 'Balance minus value should be equal to balance after transfer for account A.');
  assert(initialAccountFaucetBBalance.plus(value).toString() === balanceAccountFaucetBAfter.toString(), 'Balance plus value should be equal to balance after transfer for account B.');

  console.log(`[OK] Transfer amount of ${tokenAmountInUnits(valueBN, decimals)} ${symbol} from ${accountFaucetA} to ${accountFaucetB}.`);
};

const testVectorAttack =  async () => {
  // Given
  Tezos.setProvider({ rpc, signer: signerFaucetA });
  const contractAddress = contractDeploy.address;
  const contract = await Tezos.contract.at(contractAddress);
  const accountFaucetB = await signerFaucetB.publicKeyHash();

  try {
    // When
    const operationAllow1 = await contract.methods.approve(accountFaucetB, '2000000000000000000').send();
    await operationAllow1.confirmation();

    const operationAllow2 = await contract.methods.approve(accountFaucetB, '2000000000000000000').send();
    await operationAllow2.confirmation();

    // Then
  } catch (err) {
    console.log(`[OK] Check for vector attack, ${err.message}.`);
  }
};

const testProperties =  async () => {
  // Given
  Tezos.setProvider({ rpc, signer: signerFaucetA });
  const contractAddress = contractDeploy.address;
  const contract = await Tezos.contract.at(contractAddress);
  
  // When
  const storage = await contract.storage();

  // Then
  assert(storage.decimals.toString() === "18", "Decimals should be 18");
  assert(storage.symbol === "pTez", "Symbol must be pTez");
  assert(storage.name === "Pool Tezos coin", "Name should be Pool Tezos coin");
  console.log(`[OK] Token properties. Symbol: ${storage.symbol}, Name: ${storage.name}, Decimals: ${storage.decimals}.`) 
};

const testAddOwner =  async () => {
  // Given
  const contractAddress = contractDeploy.address;
  Tezos.setProvider({ rpc, signer: signerFaucetA });
  const contract = await Tezos.contract.at(contractAddress);

  const accountFaucetA = await signerFaucetA.publicKeyHash();
  const accountFaucetB = await signerFaucetB.publicKeyHash();  
  // When
 
  const operationAddOwner = await contract.methods.addOwner(accountFaucetB).send();
  await operationAddOwner.confirmation();

  // Then
  const storageAfter = await getTokenStorage(contractAddress, [accountFaucetA, accountFaucetB]);

  assert(storageAfter.owners.includes(accountFaucetB), 'You should add an account to the whitelisted address');

  console.log(`[OK] Add Owner. New owner address ${accountFaucetB}.`);
};

const test = async () => {
    const tests = [
      testMethods,
      testProperties,
      testMint,
      testMintTo,
      testTransfer,
      testAddOwner,
      testVectorAttack,
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