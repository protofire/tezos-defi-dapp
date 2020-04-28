import React from 'react'
import { InMemorySigner } from '@taquito/signer'
import { useAsyncMemo } from 'use-async-memo'

import { accountContext } from '../state/account.context'
import { useContracts } from '../hooks/contracts.hook'
import { tzFormatter } from '../utils/tool'

export const PoolAccountBalance = () => {
  const context = React.useContext(accountContext)
  const { poolService } = useContracts(context)

  const initialValues = { deposit: 0, borrow: 0 }
  const { deposit, borrow } = useAsyncMemo(
    async () => {
      if (!poolService) {
        return initialValues
      }
      if (!context || !context.account) {
        return initialValues
      }

      const { email, password, mnemonic } = context.account
      const signer = InMemorySigner.fromFundraiser(email, password, mnemonic.join(' '))
      const accountAddress = await signer.publicKeyHash()

      const deposit = await poolService.getMyDeposit(accountAddress)
      const borrow = await poolService.getMyBorrow(accountAddress)
      return { deposit, borrow }
    },
    [poolService, context],
    initialValues,
  )

  return (
    <>
      <div className="card bg-light" style={{ width: '300px', height: 'auto' }}>
        <header>
          <h4>My balances</h4>
        </header>
        <footer>
          <div className="row">
            <div className="col">Supply:</div>
            <div className="col is-right">{tzFormatter(deposit, 'tz')}</div>
          </div>
          <div className="row">
            <div className="col">Borrow:</div>
            <div className="col is-right">{tzFormatter(borrow, 'tz')}</div>
          </div>
        </footer>
      </div>
    </>
  )
}
