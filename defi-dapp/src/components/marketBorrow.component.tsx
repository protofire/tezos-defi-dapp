import React, { useState } from 'react'

import { Table } from './table.component'
import { AssetTezImage } from './assetTezImage.component'
import { ModalBorrow } from './modalBorrow.component'
import { PoolService } from '../services/poolContract.service'
import { useConnectedContext } from '../state/connected.context'

interface Props {
  poolService: PoolService
}

const borrowHeaders = ['Asset', 'APY', 'Wallet', '% of limit']

const MarketBorrowConnected = (props: Props) => {
  const { poolService } = props

  const [isModalBorrowOpen, setModalBorrowState] = useState(false)

  // TODO: Move this to a  hook
  const borrowValues = { asset: <AssetTezImage />, apy: '10%', wallet: 20, custom: '0%' }

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
          loading={false}
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
  const { poolService } = useConnectedContext()

  return (
    <>
      {poolService ? (
        <MarketBorrowConnected poolService={poolService} />
      ) : (
        <MarketBorrowDisconnected />
      )}
    </>
  )
}
