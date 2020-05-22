import React, { useState } from 'react'
import BigNumber from 'bignumber.js'

import { Table, TableProps } from './table.component'
import { AssetTezImage } from './assetTezImage.component'
import { ModalBorrow } from './modalBorrow.component'
import { PoolService } from '../services/poolContract.service'
import { useConnectedContext } from '../state/connected.context'
import { useAsyncMemo } from 'use-async-memo'
import { tzFormatter, percentageFormatter } from '../utils/tool'
import { Account } from '../utils/types'

interface Props {
  poolService: PoolService
  account: Maybe<Account>
  updateFlag: boolean
  setUpdateFlag: (flag: boolean) => void
}

interface MarketBorrow {
  apy: BigNumber
  wallet: BigNumber
  percentageToBorrow: {
    percentage: BigNumber
    totalAllowed: BigNumber
    used: BigNumber
  }
  loading: boolean
}

const borrowHeaders = ['Asset', 'APY', 'Wallet', '% of limit']

const MarketBorrowConnected = (props: Props) => {
  const { poolService, account, updateFlag, setUpdateFlag } = props

  const [isModalBorrowOpen, setModalBorrowState] = useState(false)

  const initialValues: MarketBorrow = {
    apy: new BigNumber(0),
    wallet: new BigNumber(0),
    percentageToBorrow: {
      percentage: new BigNumber(0),
      totalAllowed: new BigNumber(0),
      used: new BigNumber(0),
    },
    loading: true,
  }
  const marketBorrow: MarketBorrow = useAsyncMemo(
    async () => {
      const apy = await poolService.getBorrowInterestRate()
      const wallet = account ? await poolService.getTezosBalance(account.pkh) : new BigNumber(0)
      const percentageToBorrow = account
        ? await poolService.getBorrowValues(account.pkh)
        : { percentage: new BigNumber(0), totalAllowed: new BigNumber(0), used: new BigNumber(0) }
      return { apy, wallet, percentageToBorrow, loading: false }
    },
    [account, updateFlag],
    initialValues,
  )

  const borrowValues = {
    asset: <AssetTezImage />,
    apy: percentageFormatter(marketBorrow.apy),
    wallet: tzFormatter(marketBorrow.wallet, 'tz'),
    custom: percentageFormatter(marketBorrow.percentageToBorrow.percentage.multipliedBy(100)),
  }

  const tableProps: TableProps = {
    title: 'Available to borrow',
    headers: borrowHeaders,
    values: borrowValues,
    loading: marketBorrow.loading,
  }

  if (account) {
    tableProps.onClickRow = () => {
      setModalBorrowState(true)
    }
  }

  return (
    <>
      <div className="col-6">
        <Table {...tableProps} />
      </div>
      {account && (
        <ModalBorrow
          poolService={poolService}
          account={account}
          isOpen={isModalBorrowOpen}
          onClose={() => {
            setModalBorrowState(false)
            setUpdateFlag(!updateFlag)
          }}
          updateFlag={updateFlag}
        />
      )}
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
  const { poolService, account, updateFlag, setUpdateFlag } = useConnectedContext()

  return (
    <>
      {poolService ? (
        <MarketBorrowConnected
          poolService={poolService}
          account={account}
          updateFlag={updateFlag}
          setUpdateFlag={setUpdateFlag}
        />
      ) : (
        <MarketBorrowDisconnected />
      )}
    </>
  )
}
