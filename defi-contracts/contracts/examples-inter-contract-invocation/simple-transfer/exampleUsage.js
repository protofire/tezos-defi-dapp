const { Tezos } = require('@taquito/taquito')
const { InMemorySigner } = require('@taquito/signer')

// Init config
const walletA = require('./walletA.json')
const walletB = require('./walletB.json')
const contractAddress = "KT19n3PokHUFHaRphB9siH5ko2ocHrgVKcei"
const signer = InMemorySigner.fromFundraiser(walletA.email, walletA.password, walletA.mnemonic.join(' '))
const signerToTransfer = InMemorySigner.fromFundraiser(walletB.email, walletB.password, walletB.mnemonic.join(' '))

const rpc = "https://api.tez.ie/rpc/carthagenet"

Tezos.setProvider({ rpc, signer });

const useTransfer = async () => {
    const contractTransfer = await Tezos.contract.at(contractAddress)

    const account = await signerToTransfer.publicKeyHash();

    const balanceBefore = await Tezos.tz.getBalance(account)
    console.log(`Balance before: ${balanceBefore}`)

    const operation = await contractTransfer.methods.main(account).send({amount: 5})
    await operation.confirmation()

    const balanceAfter = await Tezos.tz.getBalance(account)
    console.log(`Balance before: ${balanceAfter}`)
}

(async () => {
    await useTransfer()
})().catch(e => {
    console.error(e)
    process.exit(1)
})