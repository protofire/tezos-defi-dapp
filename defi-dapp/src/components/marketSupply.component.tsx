import React, { useState } from 'react'

import { Table } from './table.component'
import { AssetTezImage } from './assetTezImage.component'
import { ToggleButton } from './toggleButton/toggleButton.component'
import { ModalSupply } from './modalSupply.component'
import { ModalAllow } from './modalAllow.component'

export const MarketSupply = () => {
  const [isModalSupplyOpen, setModalSupplyState] = useState(false)
  const [isModalAllowOpen, setModalAllowState] = useState(false)

  // TODO: Move this to a  hook
  const customSupply = (
    <ToggleButton
      onChange={() => {
        setModalAllowState(true)
      }}
      id="Allowed"
      text={['Yes', 'No']}
      name="Allowed"
    />
  )
  const supplyHeaders = ['Asset', 'APY', 'Wallet', 'Collateral']
  const supplyValues = { asset: <AssetTezImage />, apy: '10%', wallet: 20, custom: customSupply }

  return (
    <>
      <div className="col-6">
        <Table
          title="Supply"
          headers={supplyHeaders}
          values={supplyValues}
          validTHtoClick={[0, 1, 2]}
          onClickRow={() => {
            setModalSupplyState(true)
          }}
        />
      </div>
      <ModalSupply isOpen={isModalSupplyOpen} onClose={() => setModalSupplyState(false)} />
      <ModalAllow isOpen={isModalAllowOpen} onClose={() => setModalAllowState(false)} />
    </>
  )
}
