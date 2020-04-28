import React from 'react'
import { useAsyncMemo } from 'use-async-memo'

import { accountContext } from '../state/account.context'
import { useContracts } from '../hooks/contracts.hook'
import { tzFormatter } from '../utils/tool'

export const PoolStats = () => {
  const context = React.useContext(accountContext)
  const { poolService } = useContracts(context)

  const initialValues = { deposits: 0, borrows: 0 }
  const { deposits, borrows } = useAsyncMemo(
    async () => {
      if (!poolService) {
        return initialValues
      }
      const deposits = await poolService.getDeposits()
      const borrows = await poolService.getBorrows()
      return { deposits, borrows }
    },
    [poolService],
    initialValues,
  )

  return (
    <>
      <div className="card bg-light" style={{ width: '300px', height: 'auto' }}>
        <header>
          <h4>Pool stats</h4>
        </header>
        <footer>
          <div className="row">
            <div className="col">Deposits:</div>
            <div className="col is-right">{tzFormatter(deposits, 'tz')}</div>
          </div>
          <div className="row">
            <div className="col">Borrows:</div>
            <div className="col is-right">{tzFormatter(borrows, 'tz')}</div>
          </div>
        </footer>
      </div>
    </>
  )
}
