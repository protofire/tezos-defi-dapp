import React, { HTMLAttributes, useState } from 'react'
import { InMemorySigner } from '@taquito/signer'
import { useAsyncMemo } from 'use-async-memo'
import { BigNumberInput } from 'big-number-input'
import BigNumber from 'bignumber.js'

import { ModalWrapper } from './modalWrapper.component'
import { PoolService } from '../services/poolContract.service'
import { Account } from '../state/connected.context'
import { tzFormatter } from '../utils/tool'
import Loader from 'react-loader-spinner'

interface Props extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  poolService: PoolService
  account: Maybe<Account>
}

enum ModalAction {
  Supply = 'Supply',
  Withdraw = 'Withdraw',
}

interface SupplyBalance {
  supply: BigNumber
  borrowLimit: BigNumber
  borrowLimitWithAmount: BigNumber
}

interface SupplyBalanceItemProps {
  amount: Maybe<BigNumber>
  supply: BigNumber
  supplyWithAmount: BigNumber
}

const SupplyBalanceItem = (props: SupplyBalanceItemProps) => {
  const { amount, supply, supplyWithAmount } = props
  return (
    <>
      {(!amount || amount.isZero()) && <label>{tzFormatter(supply, 'tz')}</label>}
      {amount && !amount.isZero() && (
        <>
          <label>{tzFormatter(supply, 'tz')}</label>
          &nbsp;
          <img
            src="https://icongr.am/feather/arrow-right.svg?size=16&amp;color=14854f"
            alt="icon"
          />
          &nbsp;
          <label>{tzFormatter(supplyWithAmount, 'tz')}</label>
        </>
      )}
    </>
  )
}

interface SupplyTabProps {
  callback: () => any
  action: ModalAction
  active: boolean
}

const SupplyTab = (props: SupplyTabProps) => {
  const { callback, action, active } = props
  return (
    // eslint-disable-next-line
    <a
      style={{ cursor: 'pointer' }}
      onClick={callback}
      className={`${active ? 'active' : ''}`}
    >
      {action}
    </a>
  )
}

export const ModalSupply = (props: Props) => {
  const { onClose, isOpen, poolService, account } = props

  const [amount, setAmount] = useState<Maybe<BigNumber>>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [modalAction, setModalAction] = useState<ModalAction>(ModalAction.Supply)

  const initialValues = {
    supply: new BigNumber(0),
    borrowLimit: new BigNumber(0),
    borrowLimitWithAmount: new BigNumber(0),
  }

  const { supply, borrowLimit, borrowLimitWithAmount }: SupplyBalance = useAsyncMemo(
    async () => {
      if (!account) {
        return { ...initialValues }
      }
      setLoading(true)

      const { email, password, mnemonic, pkh } = account
      const signer = InMemorySigner.fromFundraiser(email, password, mnemonic.join(' '))
      const accountAddress = await signer.publicKeyHash()

      const [supply, borrow] = await Promise.all([
        poolService.getMyDeposit(accountAddress),
        poolService.getMyBorrow(accountAddress),
      ])
      const [borrowAllowed, borrowAllowedWithAmount] = await Promise.all([
        poolService.getPercentageToBorrow(pkh),
        poolService.getPercentageToBorrow(pkh, amount),
      ])

      setLoading(false)

      return {
        supply,
        borrowLimit: borrowAllowed.totalAllowed.minus(borrow),
        borrowLimitWithAmount: borrowAllowedWithAmount.totalAllowed.minus(borrow),
      }
    },
    [account, amount],
    initialValues,
  )

  const setMax = async () => {
    if (account) {
      const { email, password, mnemonic, pkh } = account
      const signer = InMemorySigner.fromFundraiser(email, password, mnemonic.join(' '))
      const accountAddress = await signer.publicKeyHash()

      const accountBalance = await poolService.getTezosBalance(accountAddress)
      setAmount(accountBalance)
    }
  }

  return (
    <ModalWrapper isOpen={isOpen} onRequestClose={onClose}>
      <div className="card">
        <header className="is-center">
          <h4>{modalAction}</h4>
        </header>
        <div className="row is-center">
          <nav className="tabs">
            <SupplyTab
              action={ModalAction.Supply}
              callback={() => setModalAction(ModalAction.Supply)}
              active={modalAction === ModalAction.Supply}
            />
            <SupplyTab
              action={ModalAction.Withdraw}
              callback={() => setModalAction(ModalAction.Withdraw)}
              active={modalAction === ModalAction.Withdraw}
            />
          </nav>
        </div>
        <div className="row" style={{ marginTop: '30px' }}>
          <div className="is-center">
            <BigNumberInput
              autofocus={true}
              decimals={6}
              onChange={newValue =>
                newValue ? setAmount(new BigNumber(newValue)) : setAmount(null)
              }
              value={amount ? amount.toString() : ''}
            />
            <button
              className="button primary"
              disabled={!account}
              onClick={setMax}
              style={{ marginLeft: '10px' }}
            >
              Max
            </button>
          </div>
        </div>
        <div className="row" style={{ marginTop: '30px' }}>
          <div className="col">
            <label>Supply balance</label>
          </div>
          <div className="col is-right">
            {loading && (
              <Loader visible={true} type="ThreeDots" color="#14854f" height={18} width={18} />
            )}
            {!loading && (
              <SupplyBalanceItem
                amount={amount}
                supply={supply}
                supplyWithAmount={supply.plus(amount || new BigNumber(0))}
              />
            )}
          </div>
        </div>
        <div className="row" style={{ marginTop: '5px' }}>
          <div className="col">
            <label>Borrow limit</label>
          </div>
          <div className="col is-right">
            {loading && (
              <Loader visible={true} type="ThreeDots" color="#14854f" height={18} width={18} />
            )}
            {!loading && (
              <SupplyBalanceItem
                amount={amount}
                supply={borrowLimit}
                supplyWithAmount={borrowLimitWithAmount}
              />
            )}
          </div>
        </div>
        <footer className="row is-right" style={{ marginTop: '30px' }}>
          <button
            className="button primary"
            disabled={!account || !amount || (amount && amount.isZero())}
          >
            {account ? modalAction : 'Please connect to your account'}
          </button>
          <button onClick={onClose} className="button">
            Cancel
          </button>
        </footer>
      </div>
    </ModalWrapper>
  )
}
