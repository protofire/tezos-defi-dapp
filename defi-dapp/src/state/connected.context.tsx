import React from 'react'
import { TezosToolkit } from '@taquito/taquito'

import { useAccount } from '../hooks/account.hook'
import { usePoolContract } from '../hooks/poolContract.hook'
import { PoolService } from '../services/poolContract.service'
import { OracleService } from '../services/oracleContract.service'
import { Account } from '../utils/types'
import { useUpdater } from '../hooks/updater.hook'
import { useOracleContract } from '../hooks/oracleContract.hook'
import { useTaquito } from '../hooks/taquito.hook'
import { baseConfig } from '../config/constants'

export interface ConnectedContext {
  account: Maybe<Account>
  setCurrentAccount: (account: Account) => void
  clearCurrentAccount: () => void
  updateFlag: boolean
  setUpdateFlag: (flag: boolean) => void
  poolService: Maybe<PoolService>
  oracleService: Maybe<OracleService>
  taquito: TezosToolkit
}

const taquito = new TezosToolkit()
taquito.setProvider({ ...baseConfig })

export const CONNECTED_CONTEXT_DEFAULT_VALUE = {
  account: null,
  setCurrentAccount: () => {},
  clearCurrentAccount: () => {},
  updateFlag: false,
  setUpdateFlag: () => {},
  poolService: null,
  oracleService: null,
  taquito,
}

const ConnectedContext = React.createContext<ConnectedContext>(CONNECTED_CONTEXT_DEFAULT_VALUE)

interface Props {
  children: React.ReactNode
}

export const ConnectedNetwork = (props: Props) => {
  const { account, setCurrentAccount, clearCurrentAccount } = useAccount()
  const taquito = useTaquito(account)
  const useUpdaterValue = useUpdater()
  const poolService = usePoolContract(account, taquito)
  const oracleService = useOracleContract(account, taquito)

  const value = {
    account,
    setCurrentAccount,
    clearCurrentAccount,
    ...useUpdaterValue,
    poolService,
    oracleService,
    taquito,
  }

  return <ConnectedContext.Provider value={value}>{props.children}</ConnectedContext.Provider>
}

export const useConnectedContext = (): ConnectedContext => {
  return React.useContext(ConnectedContext)
}
