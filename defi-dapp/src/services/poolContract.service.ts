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

  getLiquidity = async (): Promise<BigNumber> => {
    const storage = await this.getStorage()
    return storage.liquidity
  }

  getCollateralRate = async (): Promise<BigNumber> => {
    const storage = await this.getStorage()
    return storage.collateralRate
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

  getCoefficientInterest = async (): Promise<BigNumber> => {
    const storage = await this.getStorage()
    const { totalBorrows, totalDeposits } = storage
    let coefficientInterest = new BigNumber(1)
    const total: BigNumber = totalDeposits.plus(totalBorrows)
    if (total.isGreaterThan(0)) {
      coefficientInterest = totalBorrows.div(total)
    }
    return coefficientInterest
  }

  getBorrowInterestRate = async (): Promise<BigNumber> => {
    const coefficientInterest = await this.getCoefficientInterest()

    const firstCoefficient = new BigNumber(2)
    const thirdCoefficient = new BigNumber(20)
    return firstCoefficient.plus(coefficientInterest.multipliedBy(thirdCoefficient))
  }

  getSupplyInterestRate = async (): Promise<BigNumber> => {
    const borrowInterest = await this.getBorrowInterestRate()
    const coefficientInterest = await this.getCoefficientInterest()
    return borrowInterest.multipliedBy(coefficientInterest)
  }

  getTezosBalance = async (address: string): Promise<BigNumber> => {
    Tezos.setProvider({ rpc: this.rpc, signer: this.signer })
    return await Tezos.tz.getBalance(address)
  }

  getPercentageToBorrow = async (address: string, withAmount?: Maybe<BigNumber>) => {
    const myBorrow = await this.getMyBorrow(address)
    const myDeposit = await this.getMyDeposit(address)
    const collateralRate = await this.getCollateralRate()

    const totalAllowed = withAmount
      ? myDeposit.plus(withAmount).multipliedBy(collateralRate.div(100))
      : myDeposit.multipliedBy(collateralRate.div(100))

    if (totalAllowed.isZero()) {
      return {
        percentage: new BigNumber(0),
        totalAllowed: new BigNumber(0),
        used: new BigNumber(0),
      }
    }

    const used = totalAllowed.minus(myBorrow)
    return {
      percentage: used.div(totalAllowed),
      totalAllowed,
      used,
    }
  }

  getStorage = async () => await this.contract.storage()
}

export { PoolService }
