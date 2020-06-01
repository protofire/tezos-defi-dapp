import { TezosToolkit } from '@taquito/taquito'
import BigNumber from 'bignumber.js'

class OracleService {
  contractAddress: string
  contract: any
  signer: any

  constructor(contractAddress: string, contract: any, signer: any) {
    this.contractAddress = contractAddress
    this.contract = contract
    this.signer = signer
  }

  static async create(contractAddress: string, taquito: TezosToolkit) {
    const contract = await taquito.contract.at(contractAddress)
    return new OracleService(contractAddress, contract, taquito.signer)
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
