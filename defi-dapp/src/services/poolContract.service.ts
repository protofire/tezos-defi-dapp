import { Tezos, TezosToolkit, UnitValue } from '@taquito/taquito'
import BigNumber from 'bignumber.js'

import { baseConfig } from '../config/constants'

class PoolService {
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
    return new PoolService(contractAddress, contract, taquito.signer)
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

  getAccountLiquidityInformation = async (
    address: string,
  ): Promise<{
    myBorrow: BigNumber
    mySupply: BigNumber
    collateralRate: BigNumber
    liquidity: BigNumber
  }> => {
    const storage = await this.getStorage()
    const { collateralRate, liquidity } = storage

    let myBorrow = new BigNumber(0)
    let mySupply = new BigNumber(0)

    try {
      myBorrow = (await storage.borrows.get(address)).tezAmount
    } catch (err) {
      // Do nothing
    }
    try {
      mySupply = (await storage.deposits.get(address)).tezAmount
    } catch (err) {
      // Do nothing
    }

    return {
      mySupply,
      myBorrow,
      collateralRate,
      liquidity,
    }
  }

  getCoefficientInterest = async (): Promise<BigNumber> => {
    const storage = await this.getStorage()
    const { totalBorrows, totalDeposits } = storage
    let coefficientInterest = new BigNumber(1)
    const total: BigNumber = totalDeposits.plus(totalBorrows)
    if (total.isGreaterThan(new BigNumber(0))) {
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
    Tezos.setProvider({ ...baseConfig, signer: this.signer })
    return Tezos.tz.getBalance(address)
  }

  getBorrowValues = async (address: string, withAmount?: Maybe<BigNumber>) => {
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

  getStorage = async () => this.contract.storage()

  madeDeposit = async (amountToDeposit: BigNumber) => {
    const amount = Tezos.format('mutez', 'tz', amountToDeposit) as number
    return await this.contract.methods.deposit(UnitValue).send({ amount })
  }

  madeWithdraw = async (amountToWithdraw: BigNumber) => {
    const amount = Tezos.format('mutez', 'tz', amountToWithdraw) as number
    return await this.contract.methods.withdraw(amount).send()
  }

  getGasEstimationForDeposit = async (amountToEstimate: BigNumber) => {
    const amount = Tezos.format('mutez', 'tz', amountToEstimate) as number

    const tx = this.contract.methods.deposit(UnitValue).toTransferParams({ amount })
    Tezos.setProvider({ ...baseConfig, signer: this.signer })
    return Tezos.estimate.transfer(tx)
  }

  getGasEstimationForWithdraw = async (amountToEstimate: BigNumber) => {
    const amount = Tezos.format('mutez', 'tz', amountToEstimate) as number

    const tx = this.contract.methods.withdraw(amount).toTransferParams()
    Tezos.setProvider({ ...baseConfig, signer: this.signer })
    return Tezos.estimate.transfer(tx)
  }

  madeBorrow = async (amountToBorrow: BigNumber) => {
    const amount = Tezos.format('mutez', 'tz', amountToBorrow) as number
    return await this.contract.methods.borrow(amount).send()
  }

  madeRepayBorrow = async (amountToRepayBorrow: BigNumber) => {
    const amount = Tezos.format('mutez', 'tz', amountToRepayBorrow) as number
    return await this.contract.methods.repayBorrow(UnitValue).send({ amount })
  }

  getGasEstimationForBorrow = async (amountToEstimate: BigNumber) => {
    const amount = Tezos.format('mutez', 'tz', amountToEstimate) as number

    const tx = this.contract.methods.borrow(amount).toTransferParams()
    Tezos.setProvider({ ...baseConfig, signer: this.signer })
    return Tezos.estimate.transfer(tx)
  }

  getGasEstimationForRepayBorrow = async (amountToEstimate: BigNumber) => {
    const amount = Tezos.format('mutez', 'tz', amountToEstimate) as number

    const tx = this.contract.methods.repayBorrow(UnitValue).toTransferParams({ amount })
    Tezos.setProvider({ ...baseConfig, signer: this.signer })
    return Tezos.estimate.transfer(tx)
  }
}

export { PoolService }
