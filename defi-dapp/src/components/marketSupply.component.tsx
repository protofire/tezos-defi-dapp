import React, { useState } from 'react'

import { Table } from './table.component'
import { AssetTezImage } from './assetTezImage.component'
import { ModalSupply } from './modalSupply.component'
import { useConnectedContext } from '../state/connected.context'
import { PoolService } from '../services/poolContract.service'

interface Props {
  poolService: PoolService
}

const supplyHeaders = ['Asset', 'APY', 'Wallet']

const MarketSupplyConnected = (props: Props) => {
  const { poolService } = props

  const [isModalSupplyOpen, setModalSupplyState] = useState(false)

  const supplyValues = { asset: <AssetTezImage />, apy: '10%', wallet: 20 }

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
          loading={false}
        />
      </div>
      <ModalSupply isOpen={isModalSupplyOpen} onClose={() => setModalSupplyState(false)} />
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
  const { poolService } = useConnectedContext()

  return (
    <>
      {poolService ? (
        <MarketSupplyConnected poolService={poolService} />
      ) : (
        <MarketSupplyDisconnected />
      )}
    </>
  )
}
