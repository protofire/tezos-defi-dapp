import React, { HTMLAttributes, useState } from 'react'
import { InMemorySigner } from '@taquito/signer'
import { useAsyncMemo } from 'use-async-memo'
import { BigNumberInput } from 'big-number-input'
import BigNumber from 'bignumber.js'
import { useToasts } from 'react-toast-notifications'
import Loader from 'react-loader-spinner'

import { ModalWrapper } from './modalWrapper.component'
import { PoolService } from '../services/poolContract.service'
import { Account } from '../state/connected.context'
import { tzFormatter } from '../utils/tool'
import { BetterCallDevTransaction } from './betterCallDev.component'

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
  mySupply: BigNumber
  myBorrowLimit: BigNumber
  myBorrowLimitWithAmount: BigNumber
}

interface SupplyBalanceItemProps {
  amount: Maybe<BigNumber>
  mySupply: BigNumber
  mySupplyWithAmount: BigNumber
}

interface SupplyTabProps {
  callback: () => any
  action: ModalAction
  active: boolean
}

// TODO: maybe move to a component
const SupplyBalanceItem = (props: SupplyBalanceItemProps) => {
  const { amount, mySupply, mySupplyWithAmount } = props
  return (
    <>
      {(!amount || amount.isZero()) && <label>{tzFormatter(mySupply, 'tz')}</label>}
      {amount && !amount.isZero() && (
        <>
          <label>{tzFormatter(mySupply, 'tz')}</label>
          &nbsp;
          <img
            src="https://icongr.am/feather/arrow-right.svg?size=16&amp;color=14854f"
            alt="icon"
          />
          &nbsp;
          <label>{tzFormatter(mySupplyWithAmount, 'tz')}</label>
        </>
      )}
    </>
  )
}

// TODO: maybe move to a component
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

  const { addToast } = useToasts()

  const [amount, setAmount] = useState<Maybe<BigNumber>>(null)
  const [loadingBalanceInformation, setLoadingBalanceInformation] = useState<boolean>(false)
  const [loadingTransferTransaction, setLoadingTransferTransaction] = useState<boolean>(false)
  const [modalAction, setModalAction] = useState<ModalAction>(ModalAction.Supply)

  const initialValues = {
    mySupply: new BigNumber(0),
    myBorrowLimit: new BigNumber(0),
    myBorrowLimitWithAmount: new BigNumber(0),
  }

  const { mySupply, myBorrowLimit, myBorrowLimitWithAmount }: SupplyBalance = useAsyncMemo(
    async () => {
      if (!account) {
        return { ...initialValues }
      }

      setLoadingBalanceInformation(true)

      const { email, password, mnemonic, pkh } = account
      const signer = InMemorySigner.fromFundraiser(email, password, mnemonic.join(' '))
      const accountAddress = await signer.publicKeyHash()

      const [mySupply, myBorrow] = await Promise.all([
        poolService.getMyDeposit(accountAddress),
        poolService.getMyBorrow(accountAddress),
      ])

      const [myBorrowAllowed, myBorrowAllowedWithAmount] = await Promise.all([
        poolService.getPercentageToBorrow(pkh),
        poolService.getPercentageToBorrow(pkh, amount),
      ])

      setLoadingBalanceInformation(false)

      return {
        mySupply,
        myBorrowLimit: myBorrowAllowed.totalAllowed.minus(myBorrow),
        myBorrowLimitWithAmount: myBorrowAllowedWithAmount.totalAllowed.minus(myBorrow),
      }
    },
    [account, amount],
    initialValues,
  )

  const setMax = async () => {
    if (account) {
      const { email, password, mnemonic } = account
      const signer = InMemorySigner.fromFundraiser(email, password, mnemonic.join(' '))
      const accountAddress = await signer.publicKeyHash()

      const accountBalance = await poolService.getTezosBalance(accountAddress)
      setAmount(accountBalance)
    }
  }

  const submit = async () => {
    setLoadingTransferTransaction(true)
    if (amount) {
      let operation: any
      try {
        operation = await poolService.madeDeposit(amount)
        await operation.confirmation()

        const content = (
          <>
            <strong>Supply</strong>
            <div>
              Added deposit of {tzFormatter(amount, 'tz')} successfully. See transaction right{' '}
              <BetterCallDevTransaction title={'here'} hash={operation.hash} />
            </div>
          </>
        )

        addToast(content, { appearance: 'success', autoDismiss: true })
      } catch (err) {
        console.error(err.message)
        addToast(`There is an error adding a deposit.`, { appearance: 'error', autoDismiss: true })
      }
    }
    setLoadingTransferTransaction(false)
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
            {loadingBalanceInformation && (
              <Loader visible={true} type="ThreeDots" color="#14854f" height={18} width={18} />
            )}
            {!loadingBalanceInformation && (
              <SupplyBalanceItem
                amount={amount}
                mySupply={mySupply}
                mySupplyWithAmount={mySupply.plus(amount || new BigNumber(0))}
              />
            )}
          </div>
        </div>
        <div className="row" style={{ marginTop: '5px' }}>
          <div className="col">
            <label>Borrow limit</label>
          </div>
          <div className="col is-right">
            {loadingBalanceInformation && (
              <Loader visible={true} type="ThreeDots" color="#14854f" height={18} width={18} />
            )}
            {!loadingBalanceInformation && (
              <SupplyBalanceItem
                amount={amount}
                mySupply={myBorrowLimit}
                mySupplyWithAmount={myBorrowLimitWithAmount}
              />
            )}
          </div>
        </div>
        <footer className="row is-right" style={{ marginTop: '30px' }}>
          <button
            className="button primary"
            disabled={
              !account || !amount || (amount && amount.isZero()) || loadingTransferTransaction
            }
            onClick={submit}
          >
            {account && !loadingTransferTransaction && modalAction}
            {!account && !loadingTransferTransaction && 'Please connect to your account'}
            {loadingTransferTransaction && 'Waiting for transaction...'}
          </button>
          <button onClick={onClose} className="button">
            Cancel
          </button>
        </footer>
      </div>
    </ModalWrapper>
  )
}
