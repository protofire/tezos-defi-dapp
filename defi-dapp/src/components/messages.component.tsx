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

export const WithdrawMessage = ({ hash, amount }: { hash: string; amount: BigNumber }) => {
  return (
    <>
      <strong>Withdraw</strong>
      <div>
        The Withdraw of {tzFormatter(amount, 'tz')} was successfully. See transaction right{' '}
        <BetterCallDevTransaction title={'here'} hash={hash} />
      </div>
    </>
  )
}

export const BorrowMessage = ({ hash, amount }: { hash: string; amount: BigNumber }) => {
  return (
    <>
      <strong>Borrow</strong>
      <div>
        The borrow of {tzFormatter(amount, 'tz')} was successfully. See transaction right{' '}
        <BetterCallDevTransaction title={'here'} hash={hash} />
      </div>
    </>
  )
}

export const RepayBorrowMessage = ({ hash, amount }: { hash: string; amount: BigNumber }) => {
  return (
    <>
      <strong>Repay Borrow</strong>
      <div>
        The repay of {tzFormatter(amount, 'tz')} was successfully. See transaction right{' '}
        <BetterCallDevTransaction title={'here'} hash={hash} />
      </div>
    </>
  )
}
