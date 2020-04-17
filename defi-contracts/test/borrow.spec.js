const assert = require('assert');
const { Tezos, UnitValue } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');

const { getPoolStorage } = require('./utils');

const contractPoolDeploy = require('../deployed/pool_latest.json');
const contractTokenDeploy = require('../deployed/fa12_latest.json');

const faucetA = require('../faucetA.json');
const faucetB = require('../faucetB.json');

const signerFaucetA = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));
const signerFaucetB = InMemorySigner.fromFundraiser(faucetB.email, faucetB.password, faucetB.mnemonic.join(' '));

const rpc = contractPoolDeploy.network;

const testBorrow =  async () => {
  // Given
  const contractPoolAddress = contractPoolDeploy.address;
  const contractTokenAddress = contractTokenDeploy.address;

  Tezos.setProvider({ rpc, signer: signerFaucetA });

  const contractPool = await Tezos.contract.at(contractPoolAddress);
  const contractToken = await Tezos.contract.at(contractTokenAddress);

  const accountFaucetA = await signerFaucetA.publicKeyHash();
  const accountFaucetB = await signerFaucetB.publicKeyHash();

  const value = 1;

  const beforePoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
  const beforeBorrowBalance = beforePoolStorage.borrows[accountFaucetA].tezAmount;

  // When
  const operationAddOwner = await contractToken.methods.addOwner(contractPoolAddress).send();
  await operationAddOwner.confirmation();

  const operationDeposit = await contractPool.methods.deposit(UnitValue).send({ amount: 60 });
  await operationDeposit.confirmation();

  const operationBorrow = await contractPool.methods.borrow(value).send();
  await operationBorrow.confirmation();

  // Then
  const afterPoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
  const afterBorrowBalance = afterPoolStorage.borrows[accountFaucetA].tezAmount;

  assert(afterBorrowBalance.isGreaterThan(beforeBorrowBalance), 'Pool borrow should be increased');

  console.log(`[OK] Borrow: user request a borrow of ${value} tz.`)
};

const testExcessBorrow =  async () => {
  // Given
  const contractPoolAddress = contractPoolDeploy.address;
  Tezos.setProvider({ rpc, signer: signerFaucetA });
  const contractPool = await Tezos.contract.at(contractPoolAddress);
  const value = 20000000; // Send 1 tez


  try {
    // When
    const operationDeposit = await contractPool.methods.borrow(value).send();
    await operationDeposit.confirmation();

    process.exit(1);
    // Then
  } catch (err) {
    console.log(`[OK] Borrow: check excess borrow request.`)
  }
};

const testPayBorrow =  async () => {
  // Given
  const contractPoolAddress = contractPoolDeploy.address;
  const contractTokenAddress = contractTokenDeploy.address;

  Tezos.setProvider({ rpc, signer: signerFaucetA });

  const contractPool = await Tezos.contract.at(contractPoolAddress);
  const contractToken = await Tezos.contract.at(contractTokenAddress);

  const accountFaucetA = await signerFaucetA.publicKeyHash();
  const accountFaucetB = await signerFaucetB.publicKeyHash();

  const value = 1;

  const beforePoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
  const beforeBorrowBalance = beforePoolStorage.borrows[accountFaucetA].tezAmount;
  const beforeLiquidityBalance = beforePoolStorage.liquidity;

  // When

  const operationBorrow = await contractPool.methods.repayBorrow(UnitValue).send({ amount: value });
  await operationBorrow.confirmation();

  // Then
  const afterPoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
  const afterBorrowBalance = afterPoolStorage.borrows[accountFaucetA].tezAmount;
  const afterLiquidityBalance = afterPoolStorage.liquidity;

  assert(afterBorrowBalance.isLessThan(beforeBorrowBalance), 'Pool borrow should be decreased');
  assert(afterLiquidityBalance.isGreaterThan(beforeLiquidityBalance), 'Liquidity balance should be increased');

  console.log(`[OK] Borrow: user pay a borrow with ${value} tez.`)
};


const test = async () => {
    const tests = [
      testBorrow,
      testExcessBorrow,
      testPayBorrow,
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