const { Tezos } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');

const faucetA = require('../faucetA.json');
const faucetB = require('../faucetB.json');
const faucets = [faucetA, faucetB];

const rpc = "https://api.tez.ie/rpc/carthagenet";

const signer = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));
Tezos.setProvider({ rpc, signer });

const activateFaucets = async () => {
    for (const faucet of faucets) {
        const {pkh, secret} = faucet;
        const operation = await Tezos.tz.activate(pkh, secret);
        await operation.confirmation();
    }
}

(async () => {
    await activateFaucets();
})().catch(e => console.error(e));