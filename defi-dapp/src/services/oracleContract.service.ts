import { Tezos } from '@taquito/taquito'
import { InMemorySigner } from '@taquito/signer'
import BigNumber from 'bignumber.js'

class OracleService {
  contractAddress: string
  contract: any
  rpc: string
  signer?: InMemorySigner

  constructor(contractAddress: string, contract: any, rpc: string, signer?: InMemorySigner) {
    this.contractAddress = contractAddress
    this.contract = contract
    this.rpc = rpc
    if (signer) this.signer = signer
  }

  static async create(contractAddress: string, rpc: string, signer?: InMemorySigner) {
    Tezos.setProvider({ rpc, signer })
    const contract = await Tezos.contract.at(contractAddress)
    return new OracleService(contractAddress, contract, rpc, signer)
  }

  getStorage = async () => this.contract.storage()

  getAssetPrice = async (symbol: string): Promise<BigNumber> => {
      const storage = await this.getStorage()

      let price = new BigNumber(0)
      try {
          price = new BigNumber((await storage.assets.get(symbol)).price)
      } catch (err) {
          // Do nothing
      }

      return price
  }
}

export { OracleService }
