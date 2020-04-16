const { Tezos } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
let Table = require('cli-table');

const { tzFormatter, getPoolStorage, getTokenStorage, tokenAmountInUnitsWithSymbol } = require('../test/utils');

const contractPoolDeploy = require('../deployed/pool_latest.json');
const contractTokenDeploy = require('../deployed/fa12_latest.json');

const faucetA = require('../faucetA.json');
const faucetB = require('../faucetB.json');

const signerFaucetA = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));
const signerFaucetB = InMemorySigner.fromFundraiser(faucetB.email, faucetB.password, faucetB.mnemonic.join(' '));

const rpc = contractPoolDeploy.network;
const contractPoolAddress = contractPoolDeploy.address;
const contractTokenAddress = contractTokenDeploy.address;

Tezos.setProvider({ rpc, signer: signerFaucetA });

let table = new Table({
    head: ['Action', 
    'Account address', 
    'Account balance', 
    'Pool: deposit account balance',
    'Pool: total deposits', 
    'Token: account balance' 
    ],
    colWidths: [20, 40, 20, 32, 25, 25],
    style: {compact : true, 'padding-left' : 1, head: ['green']},
});

const madeWithdraw = async () => {
    const contractPool = await Tezos.contract.at(contractPoolAddress);
    const contractToken = await Tezos.contract.at(contractTokenAddress);
  
    const accountFaucetA = await signerFaucetA.publicKeyHash();
    const accountFaucetB = await signerFaucetB.publicKeyHash();

    const amount = 1;
  
    // Check storage before withdraw
    const beforePoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
    const beforeTokenStorage = await getTokenStorage(contractTokenAddress, [accountFaucetA, accountFaucetB]);
  
    const beforeDepositBalance = beforePoolStorage.deposits[accountFaucetA].tezAmount;
    const beforeTokenBalance = beforeTokenStorage.accounts[accountFaucetA].balance;
    const beforeAccountBalance = await Tezos.tz.getBalance(accountFaucetA);

    // Add values to table
    table.push([`Before withdraw ${amount} ꜩ`, accountFaucetA, tzFormatter(beforeAccountBalance, 'tz'), tzFormatter(beforeDepositBalance, 'tz'), tzFormatter(beforePoolStorage.totalDeposits, 'tz'), tokenAmountInUnitsWithSymbol(beforeTokenBalance, 18, beforeTokenStorage.symbol)]);

    // Execute withdraw
    const operationAddOwner = await contractToken.methods.addOwner(contractPoolAddress).send();
    await operationAddOwner.confirmation();
  
    const operationWithdraw = await contractPool.methods.withdraw(amount).send();
    await operationWithdraw.confirmation();

    // Check storage after withdraw
    const afterPoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
    const afterTokenStorage = await getTokenStorage(contractTokenAddress, [accountFaucetA, accountFaucetB]);
  
    const afterDepositBalance = afterPoolStorage.deposits[accountFaucetA].tezAmount;
    const afterTokenBalance = afterTokenStorage.accounts[accountFaucetA].balance;
    const afterAccountBalance = await Tezos.tz.getBalance(accountFaucetA);

    // Add values to table
    table.push([`After withdraw ${amount} ꜩ`, accountFaucetA, tzFormatter(afterAccountBalance, 'tz'), tzFormatter(afterDepositBalance, 'tz'), tzFormatter(afterPoolStorage.totalDeposits, 'tz'), tokenAmountInUnitsWithSymbol(afterTokenBalance, 18, beforeTokenStorage.symbol)]);

    console.log(table.toString());

    console.log(`Check pool contract transactions 'https://better-call.dev/carthage/${contractPoolAddress}/operations'`);
    console.log(`Check token contract transactions 'https://better-call.dev/carthage/${contractTokenAddress}/operations'`);
}

(async () => {
    await madeWithdraw();
})().catch(e => {
    console.error(e);
    process.exit(1);
});