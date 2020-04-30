import React, { useState } from 'react'
import BigNumber from 'bignumber.js'

import { Table } from './table.component'
import { AssetTezImage } from './assetTezImage.component'
import { ModalBorrow } from './modalBorrow.component'
import { PoolService } from '../services/poolContract.service'
import { Account, useConnectedContext } from '../state/connected.context'
import { useAsyncMemo } from 'use-async-memo'
import { tzFormatter, percentageFormatter } from '../utils/tool'

interface Props {
  poolService: PoolService
  account: Maybe<Account>
}

interface MarketBorrow {
  apy: BigNumber
  wallet: BigNumber
  percentageToBorrow: BigNumber
  loading: boolean
}

const borrowHeaders = ['Asset', 'APY', 'Wallet', '% of limit']

const MarketBorrowConnected = (props: Props) => {
  const { poolService, account } = props

  const [isModalBorrowOpen, setModalBorrowState] = useState(false)

  const initialValues: MarketBorrow = {
    apy: new BigNumber(0),
    wallet: new BigNumber(0),
    percentageToBorrow: new BigNumber(0),
    loading: true,
  }
  const marketBorrow: MarketBorrow = useAsyncMemo(
    async () => {
      const apy = await poolService.getBorrowInterestRate()
      const wallet = account ? await poolService.getTezosBalance(account.pkh) : new BigNumber(0)
      const percentageToBorrow = account
        ? await poolService.getPercentageToBorrow(account.pkh)
        : new BigNumber(0)
      return { apy, wallet, percentageToBorrow, loading: false }
    },
    [],
    initialValues,
  )

  const borrowValues = {
    asset: <AssetTezImage />,
    apy: percentageFormatter(marketBorrow.apy),
    wallet: tzFormatter(marketBorrow.wallet, 'tz'),
    custom: percentageFormatter(marketBorrow.percentageToBorrow.multipliedBy(100)),
  }

  return (
    <>
      <div className="col-6">
        <Table
          title="Available to borrow"
          headers={borrowHeaders}
          values={borrowValues}
          onClickRow={() => {
            setModalBorrowState(true)
          }}
          loading={marketBorrow.loading}
        />
      </div>
      <ModalBorrow isOpen={isModalBorrowOpen} onClose={() => setModalBorrowState(false)} />
    </>
  )
}

const MarketBorrowDisconnected = () => {
  return (
    <div className="col-6">
      <Table title="Supply" headers={borrowHeaders} loading={true} />
    </div>
  )
}

export const MarketBorrow = () => {
  const { poolService, account } = useConnectedContext()

  return (
    <>
      {poolService ? (
        <MarketBorrowConnected poolService={poolService} account={account} />
      ) : (
        <MarketBorrowDisconnected />
      )}
    </>
  )
}
