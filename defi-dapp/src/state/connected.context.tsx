import React from 'react'
import { useAccount } from "../hooks/account.hook"

export interface Account {
  amount: string
  email: string
  mnemonic: Array<string>
  password: string
  pkh: string
  secret: string
}

export interface ConnectedContext {
  account: Maybe<Account>
  setCurrentAccount: (account: Account) => void
  clearCurrentAccount: () => void
}

export const CONNECTED_CONTEXT_DEFAULT_VALUE = {
  account: null,
  setCurrentAccount: () => {},
  clearCurrentAccount: () => {},
}

const ConnectedContext = React.createContext<ConnectedContext>(CONNECTED_CONTEXT_DEFAULT_VALUE)

interface Props {
    children: React.ReactNode
}

export const ConnectedNetwork = (props: Props) => {
    const account = useAccount()

    const value = {
        ...account
    }

    return <ConnectedContext.Provider value={value}>{props.children}</ConnectedContext.Provider>
}

export const useConnectedContext = () => {
    const context = React.useContext(ConnectedContext)

    if (!context) {
        throw new Error('Component rendered outside the provider tree')
    }

    return context
}