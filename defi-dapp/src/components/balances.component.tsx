import React from 'react'

import { PoolAccountBalance } from './poolAccountBalance.component'
import { PoolStats } from './poolStats.component'

export const Balances = () => {
  return (
    <div className="row">
      <div className="col-6 is-right">
        <PoolStats />
      </div>
      <div className="col-6">
        <PoolAccountBalance />
      </div>
    </div>
  )
}
