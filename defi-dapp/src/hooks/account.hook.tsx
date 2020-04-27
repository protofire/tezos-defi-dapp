import React from 'react'

import { Account } from '../state/account.context'

export const useAccount = (): {
  account: Maybe<Account>
  setCurrentAccount: (account: Account) => void
} => {
  const [account, setAccount] = React.useState<Maybe<Account>>(null)

  const setCurrentAccount = React.useCallback((account: Account): void => {
    setAccount(account)
  }, [])

  return {
    account,
    setCurrentAccount,
  }
}
