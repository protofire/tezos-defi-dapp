import BigNumber from 'bignumber.js'
import { useAsyncMemo } from 'use-async-memo'

import { Action, Account } from '../utils/types'
import { PoolService } from '../services/poolContract.service'
import { getAddressFromAccount } from '../utils/tool'

interface GasEstimation {
  gasLimit: string
  storageLimit: string
  suggestedFeeMutez: string
}

export const useGasEstimation = (
  amount: Maybe<BigNumber>,
  account: Account,
  action: Action,
  poolService: PoolService,
): Maybe<GasEstimation> => {
  const gasEstimation: Maybe<GasEstimation> = useAsyncMemo(
    async () => {
      let estimate: Maybe<any> = null
      if (!amount) return estimate

      const addressAccount = await getAddressFromAccount(account)

      estimate = await poolService.getGasEstimationForDeposit(amount, addressAccount)

      return {
        gasLimit: estimate.gasLimit,
        storageLimit: estimate.storageLimit,
        suggestedFeeMutez: estimate.suggestedFeeMutez,
      }
    },
    [poolService, action, amount, account],
    null,
  )

  return gasEstimation
}
