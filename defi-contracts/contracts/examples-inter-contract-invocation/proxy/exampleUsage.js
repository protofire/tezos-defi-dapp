const { Tezos, UnitValue } = require('@taquito/taquito')
const { InMemorySigner } = require('@taquito/signer')

// Init config
const wallet = require('./wallet.json')
const contractCounterAddress = "KT1ExEhdgHTzotFdPsp4mhNC6rqK4h6EKUQu"
const contractProxyAddress = "KT1JH5omoSH8KBVid6Za3DdSLFeuKvSe13LN"
const signer = InMemorySigner.fromFundraiser(wallet.email, wallet.password, wallet.mnemonic.join(' '))
const rpc = "https://api.tez.ie/rpc/carthagenet"

Tezos.setProvider({ rpc, signer });

const useProxy = async () => {
    const contractCounter = await Tezos.contract.at(contractCounterAddress)
    const contractProxy = await Tezos.contract.at(contractProxyAddress)
    
    const contractCounterStorageBefore = await contractCounter.storage()
    console.log(`Counter storage before: ${contractCounterStorageBefore}`)

    const operationDeposit = await contractProxy.methods.increment(5).send()
    await operationDeposit.confirmation()

    const contractCounterStorageAfter = await contractCounter.storage()
    console.log(`Counter storage after: ${contractCounterStorageAfter}`)
}

(async () => {
    await useProxy()
})().catch(e => {
    console.error(e)
    process.exit(1)
})