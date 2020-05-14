import { useAsyncMemo } from 'use-async-memo'
import BigNumber from 'bignumber.js'

import { PoolService } from '../services/poolContract.service'
import { checkAccountLiquidity, getAddressFromAccount } from '../utils/tool'
import { Action, Account } from '../utils/types'

interface AccountLiquidity {
  mySupply: BigNumber
  myBorrowAvailability: BigNumber
  myBorrowAvailabilityWithAmount: BigNumber
  isAllowedToDeposit: boolean
  amountAvailableToDeposit: BigNumber
  isAllowedToWithdraw: boolean
  amountAvailableToWithdraw: BigNumber
  isAllowedToBorrow: boolean
  amountAvailableToBorrow: BigNumber
  isAllowedToRepayBorrow: boolean
  amountAvailableToRepayBorrow: BigNumber
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
    myBorrow: new BigNumber(0),
    myBorrowAvailability: new BigNumber(0),
    myBorrowAvailabilityWithAmount: new BigNumber(0),
    isAllowedToDeposit: false,
    amountAvailableToDeposit: new BigNumber(0),
    isAllowedToWithdraw: false,
    amountAvailableToWithdraw: new BigNumber(0),
    isAllowedToBorrow: false,
    amountAvailableToBorrow: new BigNumber(0),
    isAllowedToRepayBorrow: false,
    amountAvailableToRepayBorrow: new BigNumber(0),
  }

  const accountLiquidity: AccountLiquidity = useAsyncMemo(
    async () => {
      setSpinnerOn()
      const accountAddress = await getAddressFromAccount(account)

      const {
        myBorrow,
        mySupply,
        collateralRate,
        liquidity,
      } = await poolService.getAccountLiquidityInformation(accountAddress)

      amount = amount || new BigNumber(0)

      const [
        borrowValues,
        borrowValuesWithAmount,
        accountLiquidity,
        amountAvailableToDeposit,
      ] = await Promise.all([
        poolService.getBorrowValues(accountAddress),
        poolService.getBorrowValues(accountAddress, amount),
        checkAccountLiquidity({
          depositAmount: mySupply,
          borrowAmount: myBorrow,
          collateralRate: collateralRate,
        }),
        poolService.getTezosBalance(accountAddress),
      ])

      const isAllowedToDeposit = amount.isLessThanOrEqualTo(amountAvailableToDeposit)

      setSpinnerOff()

      return {
        mySupply,
        myBorrow,
        myBorrowAvailability: borrowValues.used,
        myBorrowAvailabilityWithAmount: borrowValuesWithAmount.used,
        isAllowedToDeposit,
        amountAvailableToDeposit,
        isAllowedToWithdraw: accountLiquidity.isAllowed && amount.isLessThanOrEqualTo(liquidity),
        amountAvailableToWithdraw: accountLiquidity.amountOfCollateralAvailable,
        isAllowedToBorrow:
          accountLiquidity.isAllowed && amount.isLessThanOrEqualTo(borrowValues.used),
        amountAvailableToBorrow: borrowValues.used.minus(amount),
        isAllowedToRepayBorrow: borrowValues.totalAllowed.isGreaterThanOrEqualTo(new BigNumber(0)),
        amountAvailableToRepayBorrow: borrowValues.used,
      }
    },
    [account, amount, action],
    initialValues,
  )

  return accountLiquidity
}
