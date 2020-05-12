import React from 'react'
import BigNumber from 'bignumber.js'

import { BetterCallDevTransaction } from './betterCallDev.component'
import { tzFormatter } from '../utils/tool'

export const SupplyMessage = ({ hash, amount }: { hash: string; amount: BigNumber }) => {
  return (
    <>
      <strong>Supply</strong>
      <div>
        Added deposit of {tzFormatter(amount, 'tz')} successfully. See transaction right{' '}
        <BetterCallDevTransaction title={'here'} hash={hash} />
      </div>
    </>
  )
}
