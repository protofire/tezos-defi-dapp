import React from 'react'

import { MarketSupply } from './marketSupply.component'
import { MarketBorrow } from './marketBorrow.component'

export const Markets = () => {
  return (
    <>
      <div className="row is-center is-vertical-align" style={{ marginTop: '30px' }}>
        <MarketSupply />
        <MarketBorrow />
      </div>
    </>
  )
}
