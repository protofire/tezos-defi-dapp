const { Tezos, MichelsonMap } = require('@taquito/taquito');
const fs = require("fs");

const faucet = JSON.parse(fs.readFileSync('./faucetA.json').toString());
const { email, password, mnemonic, secret } = faucet;

const providerUrl = "https://rpctest.tzbeta.net";
Tezos.setProvider({ rpc: providerUrl });

(async () => {
    await Tezos.importKey(email, password, mnemonic.join(" "), secret);
    
    const ownerAccount = await Tezos.signer.publicKeyHash();
    const op = await Tezos.contract.originate({
        code: JSON.parse(fs.readFileSync("./build/erc20_factory.json").toString()),
        storage: {
            owner: ownerAccount,
            totalSupply: "1000000000",
            accounts:  MichelsonMap.fromLiteral({
                [ownerAccount]: {
                    balance: "100000000",
                    allowances:  new MichelsonMap()
                },
            }),
        },
    });
    const contract = await op.contract();

    const detail = {
        address: contract.address,
        network: providerUrl
    }

    fs.writeFileSync('./deployed/erc20_latest.json', JSON.stringify(detail))
    console.log('Contract erc20 deployed at:', contract.address)
})().catch(e => {
    console.error(e)
});