import { useMemo } from 'react'
import { InMemorySigner } from '@taquito/signer'

import { useAsyncMemo } from 'use-async-memo'
import { TokenService } from '../services/tokenContract.service'
import { Account } from '../state/connected.context'
import {
  TOKEN_CONTRACT_ADDRESS as tokenContractAddress,
  TEZOS_RPC as rpc,
} from '../config/constants'

export const useTokenContract = (account: Account) => {
  const signer = account
    ? InMemorySigner.fromFundraiser(account.email, account.password, account.mnemonic.join(' '))
    : undefined

  const tokenService = useAsyncMemo(
    async () => await TokenService.create(tokenContractAddress, rpc, signer),
    [tokenContractAddress, rpc, signer],
    null,
  )

  return useMemo(
    () => ({
      tokenService,
    }),
    [tokenService],
  )
}
