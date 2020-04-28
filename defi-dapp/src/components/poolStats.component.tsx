import React from 'react'
import { useAsyncMemo } from 'use-async-memo'

import { accountContext } from '../state/account.context'
import { useContracts } from '../hooks/contracts.hook'
import { tzFormatter } from '../utils/tool'

export const PoolStats = () => {
  const context = React.useContext(accountContext)
  const { poolService } = useContracts(context)

  const initialValues = { deposits: 0, borrows: 0, liquidity: 0, collateralRate: 0 }
  const { deposits, borrows, liquidity, collateralRate } = useAsyncMemo(
    async () => {
      if (!poolService) {
        return initialValues
      }
      const deposits = await poolService.getDeposits()
      const borrows = await poolService.getBorrows()
      const liquidity = await poolService.getLiquidity()
      const collateralRate = await poolService.getCollateralRate()
      return { deposits, borrows, liquidity, collateralRate }
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
          <div className="row">
            <div className="col">Liquidity:</div>
            <div className="col is-right">{tzFormatter(liquidity, 'tz')}</div>
          </div>
          <div className="row">
            <div className="col">Collateral rate:</div>
            <div className="col is-right">{collateralRate.toString()} %</div>
          </div>
        </footer>
      </div>
    </>
  )
}
