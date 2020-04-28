import { Tezos } from '@taquito/taquito'
import { InMemorySigner } from '@taquito/signer'
import BigNumber from 'bignumber.js'

class PoolService {
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
    return new PoolService(contractAddress, contract, rpc, signer)
  }

  getDeposits = async (): Promise<BigNumber> => {
    const storage = await this.getStorage()
    return storage.totalDeposits
  }

  getBorrows = async (): Promise<BigNumber> => {
    const storage = await this.getStorage()
    return storage.totalBorrows
  }

  getMyDeposit = async (address: string): Promise<BigNumber> => {
    const storage = await this.getStorage()

    let deposit = new BigNumber(0)
    try {
      deposit = (await storage.deposits.get(address)).tezAmount
    } catch (err) {
      // Do nothing
    }

    return deposit
  }

  getMyBorrow = async (address: string): Promise<BigNumber> => {
    const storage = await this.getStorage()

    let borrow = new BigNumber(0)
    try {
      borrow = (await storage.borrows.get(address)).tezAmount
    } catch (err) {
      // Do nothing
    }

    return borrow
  }

  getStorage = async () => {
    return await this.contract.storage()
  }
}

export { PoolService }
