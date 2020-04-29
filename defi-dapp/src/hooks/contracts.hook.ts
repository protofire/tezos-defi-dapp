import { useMemo } from 'react'
import { InMemorySigner } from '@taquito/signer'

import { useAsyncMemo } from 'use-async-memo'
import { PoolService } from '../services/poolContract.service'
import { TokenService } from '../services/tokenContract.service'
import { ConnectedContext } from '../state/connected.context'
import {
  POOL_CONTRACT_ADDRESS as poolContractAddress,
  TOKEN_CONTRACT_ADDRESS as tokenContractAddress,
  TEZOS_RPC as rpc,
} from '../config/constants'

export const useContracts = (context: ConnectedContext) => {
  const { account } = context

  const signer = account
    ? InMemorySigner.fromFundraiser(account.email, account.password, account.mnemonic.join(' '))
    : undefined

  const poolService = useAsyncMemo(
    async () => await PoolService.create(poolContractAddress, rpc, signer),
    [poolContractAddress, rpc, signer],
    null,
  )

  const tokenService = useAsyncMemo(
    async () => await TokenService.create(tokenContractAddress, rpc, signer),
    [poolContractAddress, rpc, signer],
    null,
  )

  return useMemo(
    () => ({
      poolService,
      tokenService,
    }),
    [poolService, tokenService],
  )
}

export type Contracts = ReturnType<typeof useContracts>
