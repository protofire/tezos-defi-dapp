import { TezosToolkit } from '@taquito/taquito'

class TokenService {
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
    return new TokenService(contractAddress, contract, taquito.signer)
  }
}

export { TokenService }
