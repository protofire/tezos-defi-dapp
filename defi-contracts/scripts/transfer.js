const { Tezos } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');

const faucetA = require('../faucetA.json');

const signerFaucetA = InMemorySigner.fromFundraiser(faucetA.email, faucetA.password, faucetA.mnemonic.join(' '));

Tezos.setProvider({ rpc: 'https://api.tez.ie/rpc/carthagenet', signer: signerFaucetA });

const transfer = async() => {
    const toAddress = 'tz1iES984V5k2A3fYKacKn98NSVkiMUQ6Ji3';

    const amount = 10;

    console.log(`Transfering ${amount} ꜩ to ${toAddress}...`);
    const operation = await Tezos.contract.transfer({ to: toAddress, amount });
    console.log(`Waiting for ${operation.hash} to be confirmed...`);
    await operation.confirmation()

    console.log(`Operation injected: https://carthagenet.tzstats.com/${operation.hash}`);
};

(async () => {
    await transfer();
    process.exit(0);
})().catch(e => {
    console.error(e);
    process.exit(1);
});