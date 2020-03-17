const assert = require('assert');
const { Tezos, UnitValue } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const BigNumber = require("bignumber.js");

const { tokenAmountInUnits, unitsInTokenAmount, tzFormatter, getTokenStorage, getPoolStorage } = require('./utils');

const contractPoolDeploy = require('../deployed/pool_latest.json');
const contractTokenDeploy = require('../deployed/fa12_latest.json');

const faucetA = require('../faucetA.json');
const faucetB = require('../faucetB.json');

const signerFaucetA = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));
const signerFaucetB = InMemorySigner.fromFundraiser(faucetB.email, faucetB.password, faucetB.mnemonic.join(' '));

const rpc = "https://api.tez.ie/rpc/carthagenet";

const testDepositWithMint =  async () => {
  // Given
  Tezos.setProvider({ rpc, signer: signerFaucetA });
  const contractPoolAddress = contractPoolDeploy.address;
  const contractTokenAddress = contractTokenDeploy.address;

  Tezos.setProvider({ rpc, signer: signerFaucetA });

  const contractPool = await Tezos.contract.at(contractPoolAddress);
  const contractToken = await Tezos.contract.at(contractTokenAddress);

  const accountFaucetA = await signerFaucetA.publicKeyHash();
  const accountFaucetB = await signerFaucetB.publicKeyHash();

  const value = 2; // Send 1 tez

  const initialPoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
  const initialTokenStorage = await getTokenStorage(contractTokenAddress, [accountFaucetA, accountFaucetB]);

  const initialPoolBalance = initialPoolStorage.deposits[accountFaucetA].tezAmount;
  const initialTokenBalance = initialTokenStorage.accounts[accountFaucetA].balance;

  const decimals = initialTokenStorage.decimals;
  const symbol = initialTokenStorage.symbol;

  // When
  const operationAddOwner = await contractToken.methods.addOwner(contractPoolAddress).send();
  await operationAddOwner.confirmation();

  const operationDeposit = await contractPool.methods.deposit(UnitValue).send({ amount: value });
  await operationDeposit.confirmation();

  // Then
  const poolStorageAfter = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
  const tokenStorageAfter = await getTokenStorage(contractTokenAddress, [accountFaucetA, accountFaucetB]);

  const afterPoolBalance = poolStorageAfter.deposits[accountFaucetA].tezAmount;
  const afterTokenBalance = tokenStorageAfter.accounts[accountFaucetA].balance;

  assert(afterTokenBalance.isGreaterThan(initialTokenBalance), 'Balance should be greater');
  assert(afterPoolBalance.isGreaterThan(initialPoolBalance), 'Balance should be greater');

  console.log(`[OK] Deposit: user made a deposit of ${value} tz. Minted ${tokenAmountInUnits(afterTokenBalance.minus(initialTokenBalance), decimals)} ${symbol}`)
};

const test = async () => {
    const tests = [
      testDepositWithMint,
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