import React, { useState } from 'react'
import { useAsyncMemo } from 'use-async-memo'
import BigNumber from 'bignumber.js'

import { Table, TableProps } from './table.component'
import { AssetTezImage } from './assetTezImage.component'
import { ModalSupply } from './modalSupply.component'
import { useConnectedContext } from '../state/connected.context'
import { PoolService } from '../services/poolContract.service'
import { tzFormatter, percentageFormatter } from '../utils/tool'
import { Account } from '../utils/types'

interface Props {
  poolService: PoolService
  account: Maybe<Account>
}

interface MarketSupply {
  apy: BigNumber
  wallet: BigNumber
  loading: boolean
}

const supplyHeaders = ['Asset', 'APY', 'Wallet']

const MarketSupplyConnected = (props: Props) => {
  const { poolService, account } = props

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
    [account],
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
          account={account}
          isOpen={isModalSupplyOpen}
          onClose={() => setModalSupplyState(false)}
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
  const { poolService, account } = useConnectedContext()

  return (
    <>
      {poolService ? (
        <MarketSupplyConnected poolService={poolService} account={account} />
      ) : (
        <MarketSupplyDisconnected />
      )}
    </>
  )
}
