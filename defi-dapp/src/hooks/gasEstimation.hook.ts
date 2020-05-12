import BigNumber from 'bignumber.js'
import { useAsyncMemo } from 'use-async-memo'

import { Action } from '../utils/types'
import { PoolService } from '../services/poolContract.service'

interface GasEstimation {
  gasLimit: string
  storageLimit: string
  suggestedFeeMutez: string
}

export const useGasEstimation = (
  amount: Maybe<BigNumber>,
  action: Action,
  poolService: PoolService,
): Maybe<GasEstimation> => {
  const gasEstimation: Maybe<GasEstimation> = useAsyncMemo(
    async () => {
      let estimate: Maybe<any> = null
      if (!amount) return estimate

      switch (action) {
        case Action.Supply:
          estimate = await poolService.getGasEstimationForDeposit(amount)
          break
        case Action.Withdraw:
          estimate = await poolService.getGasEstimationForWithdraw(amount)
          break
      }

      return {
        gasLimit: estimate.gasLimit,
        storageLimit: estimate.storageLimit,
        suggestedFeeMutez: estimate.suggestedFeeMutez,
      }
    },
    [poolService, action, amount],
    null,
  )

  return gasEstimation
}
