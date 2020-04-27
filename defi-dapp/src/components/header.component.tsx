import React from 'react'

import { LoadFaucet } from './loadFaucet.component'
import { NetworkWarning } from './networkWarning.component'
import { Account } from './account.component'
import { accountContext } from '../state/account.context'

export const Header = () => {
  const { account } = React.useContext(accountContext)

  return (
    <>
      <nav className="nav">
        <div className="nav-center">
          <NetworkWarning />
        </div>
      </nav>
      <nav className="nav" style={{ marginTop: '30px' }}>
        <div className="nav-left">
          <div className="brand">Pool liquidity</div>
          <div className="nav-right">{account ? <Account /> : <LoadFaucet />}</div>
        </div>
      </nav>
    </>
  )
}
