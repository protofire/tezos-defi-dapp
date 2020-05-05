import { InMemorySigner } from '@taquito/signer'
import { useAsyncMemo } from 'use-async-memo'

import { PoolService } from '../services/poolContract.service'
import { POOL_CONTRACT_ADDRESS as poolContractAddress, TEZOS_RPC as rpc } from '../config/constants'
import { Account } from '../utils/types'

export const usePoolContract = (account: Maybe<Account>) => {
  const signer = account
    ? InMemorySigner.fromFundraiser(account.email, account.password, account.mnemonic.join(' '))
    : undefined

  const poolService = useAsyncMemo(
    async () => await PoolService.create(poolContractAddress, rpc, signer),
    [poolContractAddress, rpc],
    null,
  )

  return { poolService }
}
