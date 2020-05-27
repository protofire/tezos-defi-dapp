import React, { useState } from 'react'
import { useAsyncMemo } from 'use-async-memo'
import BigNumber from 'bignumber.js'

import { Table, TableProps } from './table.component'
import { AssetTezImage } from './assetTezImage.component'
import { ModalSupply } from './modalSupply.component'
import { useConnectedContext } from '../state/connected.context'
import { PoolService } from '../services/poolContract.service'
import { OracleService } from '../services/oracleContract.service'
import { tzFormatter, percentageFormatter } from '../utils/tool'
import { Account } from '../utils/types'

interface Props {
  poolService: PoolService
  oracleService: OracleService
  account: Maybe<Account>
  updateFlag: boolean
  setUpdateFlag: (flag: boolean) => void
}

interface MarketSupply {
  apy: BigNumber
  wallet: BigNumber
  loading: boolean
}

const supplyHeaders = ['Asset', 'APY', 'Wallet']

const MarketSupplyConnected = (props: Props) => {
  const { poolService, oracleService, account, updateFlag, setUpdateFlag } = props

  const [isModalSupplyOpen, setModalSupplyState] = useState(false)

  const initialValues: MarketSupply = {
    apy: new BigNumber(0),
    wallet: new BigNumber(0),
    loading: true,
  }

  const marketSupply: MarketSupply = useAsyncMemo(
    async () => {
      const apy = await poolService.getSupplyInterestRate()
      const wallet = account ? await poolService.getTezosBalance(account.pkh) : new BigNumber(0)
      return { apy, wallet, loading: false }
    },
    [account, updateFlag],
    initialValues,
  )

  const supplyValues = {
    asset: <AssetTezImage />,
    apy: percentageFormatter(marketSupply.apy),
    wallet: tzFormatter(marketSupply.wallet.toString(), 'tz'),
  }

  const tableProps: TableProps = {
    title: 'Supply',
    headers: supplyHeaders,
    values: supplyValues,
    loading: marketSupply.loading,
  }

  if (account) {
    tableProps.onClickRow = () => {
      setModalSupplyState(true)
    }
  }

  return (
    <>
      <div className="col-6">
        <Table {...tableProps} />
      </div>
      {account && (
        <ModalSupply
          poolService={poolService}
          oracleService={oracleService}
          account={account}
          isOpen={isModalSupplyOpen}
          onClose={() => {
            setModalSupplyState(false)
            setUpdateFlag(!updateFlag)
          }}
          updateFlag={updateFlag}
        />
      )}
    </>
  )
}

const MarketSupplyDisconnected = () => {
  return (
    <div className="col-6">
      <Table title="Supply" headers={supplyHeaders} loading={true} />
    </div>
  )
}

export const MarketSupply = () => {
  const { poolService, oracleService, account, updateFlag, setUpdateFlag } = useConnectedContext()

  return (
    <>
      {poolService && oracleService ? (
        <MarketSupplyConnected
          poolService={poolService}
          oracleService={oracleService}
          account={account}
          updateFlag={updateFlag}
          setUpdateFlag={setUpdateFlag}
        />
      ) : (
        <MarketSupplyDisconnected />
      )}
    </>
  )
}
