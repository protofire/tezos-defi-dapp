import React from 'react'

export interface Account {
  amount: string
  email: string
  mnemonic: Array<string>
  password: string
  pkh: string
  secret: string
}

export interface AccountContext {
  account: Maybe<Account>
  setCurrentAccount: (account: Account) => void
}

export const ACCOUNT_CONTEXT_DEFAULT_VALUE = {
  account: null,
  setCurrentAccount: () => {},
}

export const accountContext = React.createContext<AccountContext>(ACCOUNT_CONTEXT_DEFAULT_VALUE)
