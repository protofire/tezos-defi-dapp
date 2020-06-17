import BigNumber from 'bignumber.js'
import { useAsyncMemo } from 'use-async-memo'

import { OracleService } from '../services/oracleContract.service'
import { expMantissa } from '../config/constants'

export const useAmountInDollars = (
  amount: Maybe<BigNumber>,
  oracleService: OracleService,
): BigNumber => {
  const amountInDollars: BigNumber = useAsyncMemo(
    async () => {
      if (!amount) return new BigNumber(0)

      const price = await oracleService.getAssetPrice('xtz')

      return amount.multipliedBy(price.dividedBy(expMantissa))
    },
    [oracleService, amount],
    new BigNumber(0),
  )

  return amountInDollars
}
