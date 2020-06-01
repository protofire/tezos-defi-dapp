import { useEffect, useState } from 'react'
import { TezosToolkit } from '@taquito/taquito'

import { PoolService } from '../services/poolContract.service'
import { POOL_CONTRACT_ADDRESS as poolContractAddress } from '../config/constants'
import { Account } from '../utils/types'

export const usePoolContract = (account: Maybe<Account>, taquito: TezosToolkit) => {
  const [poolService, setPoolService] = useState<Maybe<PoolService>>(null)

  useEffect(() => {
    const initializeContract = async () => {
      const poolService = await PoolService.create(poolContractAddress, taquito)
      setPoolService(poolService)
    }

    initializeContract()
  }, [account])

  return poolService
}
