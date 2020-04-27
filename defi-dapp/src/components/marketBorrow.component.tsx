import React, { useState } from 'react'

import { Table } from './table.component'
import { AssetTezImage } from './assetTezImage.component'
import { ModalBorrow } from './modalBorrow.component'

export const MarketBorrow = () => {
  const [isModalBorrowOpen, setModalBorrowState] = useState(false)

  // TODO: Move this to a  hook
  const borrowHeaders = ['Asset', 'APY', 'Wallet', '% of limit']
  const borrowValues = { asset: <AssetTezImage />, apy: '10%', wallet: 20, custom: '0%' }

  return (
    <>
      <div className="col-6">
        <Table
          title="Available to borrow"
          headers={borrowHeaders}
          values={borrowValues}
          validTHtoClick={[0, 1, 2, 3]}
          onClickRow={() => {
            setModalBorrowState(true)
          }}
        />
      </div>
      <ModalBorrow isOpen={isModalBorrowOpen} onClose={() => setModalBorrowState(false)} />
    </>
  )
}
