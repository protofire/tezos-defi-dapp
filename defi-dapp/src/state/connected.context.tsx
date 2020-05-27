import React from 'react'

import { useAccount } from '../hooks/account.hook'
import { usePoolContract } from '../hooks/poolContract.hook'
import { PoolService } from '../services/poolContract.service'
import { OracleService } from '../services/oracleContract.service'
import { Account } from '../utils/types'
import { useUpdater } from '../hooks/updater.hook'
import { useOracleContract } from '../hooks/oracleContract.hook'

export interface ConnectedContext {
  account: Maybe<Account>
  setCurrentAccount: (account: Account) => void
  clearCurrentAccount: () => void
  poolService: Maybe<PoolService>
  oracleService: Maybe<OracleService>
  updateFlag: boolean
  setUpdateFlag: (flag: boolean) => void
}

export const CONNECTED_CONTEXT_DEFAULT_VALUE = {
  account: null,
  setCurrentAccount: () => {},
  clearCurrentAccount: () => {},
  poolService: null,
  oracleService: null,
  updateFlag: false,
  setUpdateFlag: () => {},
}

const ConnectedContext = React.createContext<ConnectedContext>(CONNECTED_CONTEXT_DEFAULT_VALUE)

interface Props {
  children: React.ReactNode
}

export const ConnectedNetwork = (props: Props) => {
  const useAccountValue = useAccount()
  const useUpdaterValue = useUpdater()
  const { poolService } = usePoolContract(useAccountValue.account)
  const { oracleService } = useOracleContract(useAccountValue.account)

  const value = {
    ...useAccountValue,
    ...useUpdaterValue,
    poolService,
    oracleService,
  }

  return <ConnectedContext.Provider value={value}>{props.children}</ConnectedContext.Provider>
}

export const useConnectedContext = (): ConnectedContext => {
  return React.useContext(ConnectedContext)
}
