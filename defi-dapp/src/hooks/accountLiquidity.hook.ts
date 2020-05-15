import { useAsyncMemo } from 'use-async-memo'
import BigNumber from 'bignumber.js'

import { PoolService } from '../services/poolContract.service'
import { checkAccountLiquidity, getAddressFromAccount } from '../utils/tool'
import { Action, Account } from '../utils/types'

interface AccountLiquidity {
  mySupply: BigNumber
  myBorrow: BigNumber
  myBorrowAvailability: BigNumber
  myBorrowAvailabilityWithAmount: BigNumber
  isAllowedToDeposit: boolean
  amountAvailableToDeposit: BigNumber
  isAllowedToWithdraw: boolean
  amountAvailableToWithdraw: BigNumber
  isAllowedToBorrow: boolean
  isAllowedToRepayBorrow: boolean
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
    isAllowedToRepayBorrow: false,
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
          accountLiquidity.isAllowed && amount.isLessThanOrEqualTo(borrowValues.totalAllowed),
        isAllowedToRepayBorrow: borrowValues.used.isGreaterThanOrEqualTo(new BigNumber(0)),
      }
    },
    [account, amount, action],
    initialValues,
  )

  return accountLiquidity
}
