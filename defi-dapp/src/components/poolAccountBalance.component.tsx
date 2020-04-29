import React from 'react'
import { InMemorySigner } from '@taquito/signer'
import { useAsyncMemo } from 'use-async-memo'
import Loader from 'react-loader-spinner'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'
import BigNumber from 'bignumber.js'

import { accountContext } from '../state/account.context'
import { useContracts } from '../hooks/contracts.hook'
import { tzFormatter } from '../utils/tool'

export const PoolAccountBalance = () => {
  const context = React.useContext(accountContext)
  const { poolService } = useContracts(context)

  const initialValues = { deposit: 0, borrow: 0, loading: true }
  const { deposit, borrow, loading } = useAsyncMemo(
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

      let deposit = new BigNumber(0)
      let borrow = new BigNumber(0)
      try {
        deposit = await poolService.getMyDeposit(accountAddress)
        borrow = await poolService.getMyBorrow(accountAddress)
      } catch (err) {
        console.error(err)
      }
      const loading = false
      return { deposit, borrow, loading }
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
          <div className="is-center">
            <Loader visible={loading} type="ThreeDots" color="#14854f" height={80} width={80} />
          </div>
          <div className={`${loading ? 'is-hidden' : ''}`}>
            <div className="row">
              <div className="col">Supply:</div>
              <div className="col is-right">{tzFormatter(deposit, 'tz')}</div>
            </div>
            <div className="row">
              <div className="col">Borrow:</div>
              <div className="col is-right">{tzFormatter(borrow, 'tz')}</div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
