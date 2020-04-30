import React, { useState } from 'react'
import BigNumber from 'bignumber.js'

import { Table } from './table.component'
import { AssetTezImage } from './assetTezImage.component'
import { ModalSupply } from './modalSupply.component'
import { useConnectedContext, Account } from '../state/connected.context'
import { PoolService } from '../services/poolContract.service'
import { useAsyncMemo } from 'use-async-memo'
import { tzFormatter, percentageFormatter } from '../utils/tool'

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

  return (
    <>
      <div className="col-6">
        <Table
          title="Supply"
          headers={supplyHeaders}
          values={supplyValues}
          onClickRow={() => {
            setModalSupplyState(true)
          }}
          loading={marketSupply.loading}
        />
      </div>
      <ModalSupply
        poolService={poolService}
        account={account}
        isOpen={isModalSupplyOpen}
        onClose={() => setModalSupplyState(false)}
      />
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
