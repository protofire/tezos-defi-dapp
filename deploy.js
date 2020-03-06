const { Tezos, MichelsonMap } = require('@taquito/taquito');
const fs = require("fs");

const faucet = JSON.parse(fs.readFileSync('./faucetA.json').toString());
const { email, password, mnemonic, secret } = faucet;

const providerUrl = "https://rpctest.tzbeta.net";
Tezos.setProvider({ rpc: providerUrl });

const setup = async () => {
    await Tezos.importKey(email, password, mnemonic.join(" "), secret);
    const ownerAccount = await Tezos.signer.publicKeyHash();
    return ownerAccount;
}

const deployFa12Contract = async (ownerAccount) => {
    // Deploy fa12 contract
    const op = await Tezos.contract.originate({
        code: JSON.parse(fs.readFileSync("./build/fa12_factory.json").toString()),
        storage: {
            owner: ownerAccount,
            totalSupply: "1000000000",
            accounts:  MichelsonMap.fromLiteral({
                [ownerAccount]: {
                    balance: "100000000",
                    allowances:  new MichelsonMap(),
                },
            }),
        },
    });
    const contract = await op.contract();

    const detail = {
        address: contract.address,
        network: providerUrl,
    };

    fs.writeFileSync('./deployed/fa12_latest.json', JSON.stringify(detail));
    console.log('Contract fa12 deployed at:', contract.address);
}

const deployPoolContract = async (ownerAccount) => {

    // Deploy pool contract
    const op = await Tezos.contract.originate({
        code: JSON.parse(fs.readFileSync("./build/pool_factory.json").toString()),
        storage: {
            owner: ownerAccount,
            interest: 0,
            deposits: new MichelsonMap(),
            liquidity: 0,
        },
    });
    const contract = await op.contract();

    const detail = {
        address: contract.address,
        network: providerUrl,
    };

    fs.writeFileSync('./deployed/pool_latest.json', JSON.stringify(detail));
    console.log('Contract pool deployed at:', contract.address);

}

(async () => {
    const ownerAccount = await setup();

    await deployFa12Contract(ownerAccount);

    await deployPoolContract(ownerAccount);

})().catch(e => {
    console.error(e)
});