import React from 'react'
import { useAsyncMemo } from 'use-async-memo'
import Loader from 'react-loader-spinner'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'

import { accountContext } from '../state/account.context'
import { useContracts } from '../hooks/contracts.hook'
import { tzFormatter } from '../utils/tool'

export const PoolStats = () => {
  const context = React.useContext(accountContext)
  const { poolService } = useContracts(context)

  const initialValues = { deposits: 0, borrows: 0, liquidity: 0, collateralRate: 0, loading: true }
  const { deposits, borrows, liquidity, collateralRate, loading } = useAsyncMemo(
    async () => {
      if (!poolService) {
        return initialValues
      }
      const deposits = await poolService.getDeposits()
      const borrows = await poolService.getBorrows()
      const liquidity = await poolService.getLiquidity()
      const collateralRate = await poolService.getCollateralRate()
      const loading = false
      return { deposits, borrows, liquidity, collateralRate, loading }
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
          <div className="is-center">
            <Loader visible={loading} type="ThreeDots" color="#14854f" height={80} width={80} />
          </div>
          <div className={`${loading ? 'is-hidden' : ''}`}>
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
          </div>
        </footer>
      </div>
    </>
  )
}
