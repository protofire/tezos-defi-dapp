import React from 'react'
import { useAsyncMemo } from 'use-async-memo'
import Loader from 'react-loader-spinner'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'
import BigNumber from 'bignumber.js'

import { tzFormatter } from '../utils/tool'
import { PoolService } from '../services/poolContract.service'
import { useConnectedContext } from '../state/connected.context'

interface PoolStats {
  deposits: BigNumber
  borrows: BigNumber
  liquidity: BigNumber
  collateralRate: BigNumber
  loading: boolean
}

const PoolStatsConnected = ({
  poolService,
  updateFlag,
}: {
  poolService: PoolService
  updateFlag: boolean
}) => {
  const initialValues = {
    deposits: new BigNumber(0),
    borrows: new BigNumber(0),
    liquidity: new BigNumber(0),
    collateralRate: new BigNumber(0),
    loading: true,
  }
  const { deposits, borrows, liquidity, collateralRate, loading }: PoolStats = useAsyncMemo(
    async () => {
      const deposits = await poolService.getDeposits()
      const borrows = await poolService.getBorrows()
      const liquidity = await poolService.getLiquidity()
      const collateralRate = await poolService.getCollateralRate()
      return { deposits, borrows, liquidity, collateralRate, loading: false }
    },
    [updateFlag],
    initialValues,
  )
  return (
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
  )
}

const PoolStatsDisconnected = () => {
  return (
    <div className="card bg-light" style={{ width: '300px', height: 'auto' }}>
      <header>
        <h4>Pool stats</h4>
      </header>
      <footer>
        <div className="is-center">
          <Loader visible={true} type="ThreeDots" color="#14854f" height={80} width={80} />
        </div>
      </footer>
    </div>
  )
}

export const PoolStats = () => {
  const context = useConnectedContext()
  const { poolService, updateFlag } = context

  return (
    <>
      {poolService ? (
        <PoolStatsConnected poolService={poolService} updateFlag={updateFlag} />
      ) : (
        <PoolStatsDisconnected />
      )}
    </>
  )
}
