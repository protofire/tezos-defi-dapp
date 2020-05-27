import { InMemorySigner } from '@taquito/signer'
import { useAsyncMemo } from 'use-async-memo'

import { OracleService } from '../services/oracleContract.service'
import {
  ORACLE_CONTRACT_ADDRESS as oracleContractAddress,
  TEZOS_RPC as rpc,
} from '../config/constants'
import { Account } from '../utils/types'

export const useOracleContract = (account: Maybe<Account>) => {
  const signer = account
    ? InMemorySigner.fromFundraiser(account.email, account.password, account.mnemonic.join(' '))
    : undefined

  const oracleService = useAsyncMemo(
    async () => await OracleService.create(oracleContractAddress, rpc, signer),
    [],
    null,
  )

  return { oracleService }
}
