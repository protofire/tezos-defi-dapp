import { TezosToolkit } from '@taquito/taquito'
import { useEffect, useState } from 'react'

import { OracleService } from '../services/oracleContract.service'
import { ORACLE_CONTRACT_ADDRESS as oracleContractAddress } from '../config/constants'
import { Account } from '../utils/types'

export const useOracleContract = (account: Maybe<Account>, taquito: TezosToolkit) => {
  const [oracleService, setOracleService] = useState<Maybe<OracleService>>(null)

  useEffect(() => {
    const initializeContract = async () => {
      const oracleService = await OracleService.create(oracleContractAddress, taquito)
      setOracleService(oracleService)
    }

    initializeContract()
  }, [account])

  return oracleService
}
