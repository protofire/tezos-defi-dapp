import React, { HTMLAttributes, useState } from 'react'
import { BigNumberInput } from 'big-number-input'
import BigNumber from 'bignumber.js'
import { useToasts } from 'react-toast-notifications'
import Loader from 'react-loader-spinner'

import { ModalWrapper } from './modalWrapper.component'
import { GasEstimation } from './gasEstimation.component'
import { Tab } from './tab.component'
import { BalanceVariationItem } from './balanceVariation.component'
import { PoolService } from '../services/poolContract.service'
import { Action, Account } from '../utils/types'
import { BorrowMessage, RepayBorrowMessage } from './messages.component'
import { tzFormatter } from '../utils/tool'

interface Props extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  poolService: PoolService
  account: Account
}

export const ModalBorrow = (props: Props) => {
  const { onClose, isOpen, poolService, account } = props

  const { addToast } = useToasts()

  const [amount, setAmount] = useState<Maybe<BigNumber>>(null)
  const [transferAction, setTransferAction] = useState<Action>(Action.Borrow)
  const [loadingTransferTransaction, setLoadingTransferTransaction] = useState<boolean>(false)

  const setMax = async () => {
    if (transferAction === Action.Borrow) {
      // TODO add max amount
    } else {
      // TODO add max amount
    }
  }

  const submit = async () => {
    if (!amount) return

    setLoadingTransferTransaction(true)
    if (transferAction === Action.Borrow) {
      let operation: any
      try {
        operation = await poolService.madeBorrow(amount)
        await operation.confirmation()

        const content = <BorrowMessage hash={operation.hash} amount={amount} />

        addToast(content, { appearance: 'success', autoDismiss: true })

        onClose()
      } catch (err) {
        // eslint-disable-next-line
                console.error(err.message)
        addToast(`There is an error borrowing an amount.`, {
          appearance: 'error',
          autoDismiss: true,
        })
      }
    } else {
      let operation: any
      try {
        operation = await poolService.madeRepayBorrow(amount)
        await operation.confirmation()
        const content = <RepayBorrowMessage hash={operation.hash} amount={amount} />

        addToast(content, { appearance: 'success', autoDismiss: true })

        onClose()
      } catch (err) {
        // eslint-disable-next-line
                console.error(err.message)
        addToast(`There is an error paying the borrow.`, { appearance: 'error', autoDismiss: true })
      }
    }
    setLoadingTransferTransaction(false)
  }

  const callbackBorrow = () => {
    setTransferAction(Action.Borrow)
    if (amount) {
      setAmount(null)
    }
  }

  const callbackRepayBorrow = () => {
    setTransferAction(Action.RepayBorrow)
    if (amount) {
      setAmount(null)
    }
  }

  const disableButtonSubmit = !amount || (amount && amount.isZero()) || loadingTransferTransaction

  const disableButtonCancel = loadingTransferTransaction

  return (
    <ModalWrapper isOpen={isOpen} onRequestClose={onClose}>
      <div className="card">
        <header className="is-center">
          <h4>{transferAction}</h4>
        </header>
        <div className="row is-center">
          <nav className="tabs">
            <Tab
              action={Action.Borrow}
              callback={callbackBorrow}
              active={transferAction === Action.Borrow}
            />
            <Tab
              action={Action.RepayBorrow}
              callback={callbackRepayBorrow}
              active={transferAction === Action.RepayBorrow}
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
        <div className={`row is-left}`}>
          <span className="text-grey">Max amount allowed: </span>
        </div>
        <div className="row" style={{ marginTop: '30px' }}>
          <div className="col">
            <label>Borrow balance</label>
          </div>
          <div className="col is-right">
            <BalanceVariationItem amountFrom={new BigNumber(0)} amountTo={new BigNumber(0)} />
          </div>
        </div>
        <div className="row" style={{ marginTop: '5px' }}>
          <div className="col">
            <label>Borrow limit</label>
          </div>
          <div className="col is-right">
            <BalanceVariationItem amountFrom={new BigNumber(0)} amountTo={new BigNumber(0)} />
          </div>
        </div>
        <footer className="row is-right" style={{ marginTop: '30px' }}>
          <GasEstimation amount={amount} action={transferAction} poolService={poolService} />
          <button
            className="button primary"
            disabled={disableButtonSubmit}
            onClick={submit}
            style={{ marginLeft: '1rem' }}
          >
            {account && !loadingTransferTransaction && transferAction}
            {!account && !loadingTransferTransaction && 'Please connect to your account'}
            {loadingTransferTransaction && 'Waiting...'}
          </button>
          <button disabled={disableButtonCancel} onClick={onClose} className="button">
            Cancel
          </button>
        </footer>
      </div>
    </ModalWrapper>
  )
}
