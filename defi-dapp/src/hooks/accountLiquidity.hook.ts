import { useAsyncMemo } from 'use-async-memo'
import BigNumber from 'bignumber.js'

import { PoolService } from '../services/poolContract.service'
import { checkAccountLiquidity, getAddressFromAccount } from '../utils/tool'
import { Action, Account } from '../utils/types'

interface AccountLiquidity {
  mySupply: BigNumber
  myBorrowLimit: BigNumber
  myBorrowLimitWithAmount: BigNumber
  isAllowedToDeposit: boolean
  amountAvailableToDeposit: BigNumber
  isAllowedToWithdraw: boolean
  amountAvailableToWithdraw: BigNumber
}

export const useAccountLiquidity = (
  account: Account,
  poolService: PoolService,
  action: Action,
  amount: Maybe<BigNumber>,
  setSpinnerOn: () => void,
  setSpinnerOff: () => void,
): AccountLiquidity => {
  const initialValues = {
    mySupply: new BigNumber(0),
    myBorrowLimit: new BigNumber(0),
    myBorrowLimitWithAmount: new BigNumber(0),
    isAllowedToDeposit: false,
    amountAvailableToDeposit: new BigNumber(0),
    isAllowedToWithdraw: false,
    amountAvailableToWithdraw: new BigNumber(0),
  }

  const {
    mySupply,
    myBorrowLimit,
    myBorrowLimitWithAmount,
    isAllowedToDeposit,
    amountAvailableToDeposit,
    isAllowedToWithdraw,
    amountAvailableToWithdraw,
  }: AccountLiquidity = useAsyncMemo(
    async () => {
      setSpinnerOn()
      const accountAddress = await getAddressFromAccount(account)

      const {
        myBorrow,
        mySupply,
        collateralRate,
        liquidity,
      } = await poolService.getAccountLiquidityInformation(accountAddress)

      const withAmount =
        action === Action.Withdraw && amount ? amount.multipliedBy(-1) : amount || new BigNumber(0)

      const [
        myBorrowAllowed,
        myBorrowAllowedWithAmount,
        { isAllowed, amountOfCollateralAvailable },
        amountAvailableToDeposit,
      ] = await Promise.all([
        poolService.getPercentageToBorrow(accountAddress),
        poolService.getPercentageToBorrow(accountAddress, withAmount),
        checkAccountLiquidity({
          amountToValidate: withAmount,
          depositAmount: myBorrow,
          borrowAmount: mySupply,
          collateralRate: collateralRate,
          liquidity: liquidity,
        }),
        poolService.getTezosBalance(accountAddress),
      ])

      const myBorrowLimit = myBorrowAllowed.totalAllowed.minus(myBorrow)
      const myBorrowLimitWithAmount = myBorrowAllowedWithAmount.totalAllowed.minus(myBorrow)

      const isAllowedToDeposit = withAmount.isLessThanOrEqualTo(amountAvailableToDeposit)

      setSpinnerOff()

      return {
        mySupply,
        myBorrowLimit,
        myBorrowLimitWithAmount,
        isAllowedToWithdraw: isAllowed,
        amountAvailableToWithdraw: amountOfCollateralAvailable,
        isAllowedToDeposit,
        amountAvailableToDeposit,
      }
    },
    [account, amount, action],
    initialValues,
  )

  return {
    mySupply,
    myBorrowLimit,
    myBorrowLimitWithAmount,
    isAllowedToDeposit,
    amountAvailableToDeposit,
    isAllowedToWithdraw,
    amountAvailableToWithdraw,
  }
}
