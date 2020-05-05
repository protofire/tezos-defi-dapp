import React from 'react'

import { useAccount } from '../hooks/account.hook'
import { usePoolContract } from '../hooks/poolContract.hook'
import { PoolService } from '../services/poolContract.service'
import { Account } from '../utils/types'

export interface ConnectedContext {
  account: Maybe<Account>
  setCurrentAccount: (account: Account) => void
  clearCurrentAccount: () => void
  poolService: Maybe<PoolService>
}

export const CONNECTED_CONTEXT_DEFAULT_VALUE = {
  account: null,
  setCurrentAccount: () => {},
  clearCurrentAccount: () => {},
  poolService: null,
}

const ConnectedContext = React.createContext<ConnectedContext>(CONNECTED_CONTEXT_DEFAULT_VALUE)

interface Props {
  children: React.ReactNode
}

export const ConnectedNetwork = (props: Props) => {
  const useAccountValue = useAccount()
  const { poolService } = usePoolContract(useAccountValue.account)

  const value = {
    ...useAccountValue,
    poolService,
  }

  return <ConnectedContext.Provider value={value}>{props.children}</ConnectedContext.Provider>
}

export const useConnectedContext = (): ConnectedContext => {
  return React.useContext(ConnectedContext)
}
