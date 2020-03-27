const { Tezos, MichelsonMap, UnitValue, MichelsonSet } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const fs = require("fs");

const faucetA = require('../faucetA.json');

const rpc = "https://api.tez.ie/rpc/carthagenet";

const signer = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));
Tezos.setProvider({ rpc, signer });

let contracts = ['fa12', 'pool'];

const args = process.argv.slice(2);

if( args.length ) {
    contracts = args
}

const deployer = async (options) => {
    const { file, storage, owner } = options;

    const op = await Tezos.contract.originate({
        code: JSON.parse(fs.readFileSync(`./build/${file}_factory.json`).toString()),
        storage,
    });
    await op.confirmation();
    const contract = await op.contract();

    const detail = {
        address: contract.address,
        owner,
        network: rpc,
    };

    fs.writeFileSync(`./deployed/${file}_latest.json`, JSON.stringify(detail));
    console.log(`Contract ${file} deployed at:`, contract.address);

    return contract;
}

const deployFa12Contract = async () => {
    // Deploy fa12 contract
    const owner = await Tezos.signer.publicKeyHash();
    const storage = {
        owners: [owner],
        totalSupply: "1000000000000000000000000",
        decimals: "18",
        symbol: "pTez",
        name: "Pool Tezos coin",
        accounts:  MichelsonMap.fromLiteral({
            [owner]: {
                balance: "1000000000000000000000000",
                allowances:  new MichelsonMap(),
            },
        }),
    };

    await deployer({storage, file: 'fa12', owner});
};

const deployPoolContract = async () => {
    // Deploy pool contract
    const contractFa12Deploy = require('../deployed/fa12_latest.json');
    const owner = await Tezos.signer.publicKeyHash();

    const storage = {
        owner,
        exchangeRatio: 2,
        collateralRatio: 2,
        deposits: new MichelsonMap(),
        borrows: new MichelsonMap(),
        liquidity: 0,
        token: {
            contractAddress: contractFa12Deploy.address,
            tokenDecimals: 18,
        }
    }

    const contractPool = await deployer({storage, file: 'pool', owner});

    // Send tez
    const operationAddLiquidity = await contractPool.methods.addLiquidity(UnitValue).send({ amount: 10 });
    await operationAddLiquidity.confirmation();
};

(async () => {
    if(contracts.includes('fa12')) await deployFa12Contract();
    if(contracts.includes('pool')) await deployPoolContract();
})().catch(e => console.error(e));