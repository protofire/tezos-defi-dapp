const { Tezos } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
let Table = require('cli-table');

const { tzFormatter, getPoolStorage } = require('../test/utils');

const contractPoolDeploy = require('../deployed/pool_latest.json');

const faucetA = require('../faucetA.json');
const faucetB = require('../faucetB.json');

const signerFaucetA = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));
const signerFaucetB = InMemorySigner.fromFundraiser(faucetB.email, faucetB.password, faucetB.mnemonic.join(' '));

const rpc = contractPoolDeploy.network;
const contractPoolAddress = contractPoolDeploy.address;

Tezos.setProvider({ rpc, signer: signerFaucetA });

let table = new Table({
    head: ['Action', 
        'Account address', 
        'Account balance', 
        'Fee',
        'Pool: deposit balance', 
        'Pool: borrow balance', 
        'Pool: total deposits', 
        'Pool: total borrows' 
    ],
    colWidths: [20, 38, 18, 13, 20, 20, 20, 20],
    style: {compact : true, 'padding-left' : 1, head: ['green']},
});

const madeBorrow = async () => {
    const contractPool = await Tezos.contract.at(contractPoolAddress);
  
    const accountFaucetA = await signerFaucetA.publicKeyHash();
    const accountFaucetB = await signerFaucetB.publicKeyHash();

    const amount = 1;
  
    // Check storage before borrow
    const beforePoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
  
    const beforeDepositBalance = beforePoolStorage.deposits[accountFaucetA].tezAmount;
    const beforeBorrowBalance = beforePoolStorage.borrows[accountFaucetA].tezAmount;
    const beforeAccountBalance = await Tezos.tz.getBalance(accountFaucetA);

    // Add values to table
    table.push([`Before borrow ${amount} ꜩ`, 
        accountFaucetA, 
        tzFormatter(beforeAccountBalance, 'tz'), 
        tzFormatter(0, 'tz'),
        tzFormatter(beforeDepositBalance, 'tz'), 
        tzFormatter(beforeBorrowBalance, 'tz'), 
        tzFormatter(beforePoolStorage.totalDeposits, 'tz'), 
        tzFormatter(beforePoolStorage.totalBorrows, 'tz'), 
    ]);

    // Execute borrow
    const operationBorrow = await contractPool.methods.borrow(amount).send();
    await operationBorrow.confirmation();

    // Check storage after borrow
    const afterPoolStorage = await getPoolStorage(contractPoolAddress, [accountFaucetA, accountFaucetB]);
  
    const afterDepositBalance = afterPoolStorage.deposits[accountFaucetA].tezAmount;
    const afterBorrowBalance = afterPoolStorage.borrows[accountFaucetA].tezAmount;
    const afterAccountBalance = await Tezos.tz.getBalance(accountFaucetA);

    // Add values to table
    table.push([]);
    table.push([`After borrow ${amount} ꜩ`, 
        accountFaucetA, 
        tzFormatter(afterAccountBalance, 'tz'),
        tzFormatter(operationBorrow.params.fee, 'tz'),
        tzFormatter(afterDepositBalance, 'tz'), 
        tzFormatter(afterBorrowBalance, 'tz'), 
        tzFormatter(afterPoolStorage.totalDeposits, 'tz'), 
        tzFormatter(afterPoolStorage.totalBorrows, 'tz'),
    ]);

    console.log(table.toString());

    console.log(`Check pool contract transactions 'https://better-call.dev/carthage/${contractPoolAddress}/operations'`);
}

(async () => {
    await madeBorrow();
})().catch(e => {
    console.error(e);
    process.exit(1);
});