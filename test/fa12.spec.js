const assert = require('assert');
const { Tezos } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');

const fa12LatestDeploy = require('../deployed/fa12_latest.json');
const poolLatestDeploy = require('../deployed/pool_latest.json');
const faucet = require('../faucetA.json');

const { email, password, mnemonic , secret } = faucet;
const signer = InMemorySigner.fromFundraiser(email,password, mnemonic.join(' '));
Tezos.setProvider({ rpc: fa12LatestDeploy.network, signer });

const testMethods = async () => {
    // Given
    const fa12Contract = await Tezos.contract.at(fa12LatestDeploy.address);
    const methods = fa12Contract.methods;

    // When
    const methodsKeys = Object.keys(methods);
    const methodsThatMustExist = ['transfer', 'mint', 'getTotalSupply', 'getBalance', 'getAllowance', 'burn', 'approve'];
    
    //Then
    assert(methodsKeys.length === methodsThatMustExist.length, "Some methods doesn't exist");
    console.log('[OK] Quantity of methods.')
};

const testMint =  async () => {
    // Given
    const fa12Contract = await Tezos.contract.at(fa12LatestDeploy.address);
    const storageBefore = await fa12Contract.storage();
    const value = '10';

    // When
    const op = await fa12Contract.methods.mint(value).send();
    await op.confirmation();

    // Then
    const signerAccount = await Tezos.signer.publicKeyHash();

    const signerAccountFromStorageBefore = await storageBefore.accounts.get(signerAccount);
    //const balanceStorageBefore = signerAccountFromStorageBefore.balance;

    const storageAfter = await fa12Contract.storage();
//    const signerAccountFromStorageAfter = await storageAfter.accounts.get(signerAccount);
  //  const balanceStorageAfter = signerAccountFromStorageAfter.balance;

    //console.log(balanceStorageBefore, balanceStorageAfter);

    assert(storageBefore.totalSupply.plus(value).toString(),  storageAfter.totalSupply.toString(), 'TotalSupply should be the same.');
    console.log('[OK] Mint.')
};

const test = async () => {
    const tests = [testMethods, testMint];
    for (let test of tests) {
        await test();
    }
};
  
(async () => {
    await test();
})().catch(e => {
    console.error(e)
});