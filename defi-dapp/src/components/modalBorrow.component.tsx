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
import { useAccountLiquidity } from '../hooks/accountLiquidity.hook'

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
  const [loadingAccountLiquidity, setLoadingAccountLiquidity] = useState<boolean>(false)
  const [transferAction, setTransferAction] = useState<Action>(Action.Borrow)
  const [loadingTransferTransaction, setLoadingTransferTransaction] = useState<boolean>(false)

  const {
    myBorrow,
    myBorrowAvailability,
    isAllowedToBorrow,
    isAllowedToRepayBorrow,
  } = useAccountLiquidity(
    account,
    poolService,
    transferAction,
    amount,
    () => {
      setLoadingAccountLiquidity(true)
    },
    () => {
      setLoadingAccountLiquidity(false)
    },
  )

  const setMax = async () => {
    if (transferAction === Action.Borrow) {
      setAmount(myBorrowAvailability)
    } else {
      setAmount(myBorrow)
    }
  }

  const close = () => {
    // Reset to initial state
    setAmount(null)
    setTransferAction(Action.Borrow)
    onClose()
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

        close()
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

        close()
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

  const disableButtonSubmit =
    !amount ||
    (amount && amount.isZero()) ||
    loadingTransferTransaction ||
    loadingAccountLiquidity ||
    (transferAction === Action.Borrow && !isAllowedToBorrow) ||
    (transferAction === Action.RepayBorrow && !isAllowedToRepayBorrow)

  const disableButtonCancel = loadingTransferTransaction

  return (
    <ModalWrapper isOpen={isOpen} onRequestClose={close}>
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
              max={
                transferAction === Action.Borrow
                  ? myBorrowAvailability.toString()
                  : myBorrow.toString()
              }
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
          <span className="text-grey">
            Max amount allowed:
            {loadingAccountLiquidity && (
              <Loader visible={true} type="ThreeDots" color="#14854f" height={18} width={18} />
            )}
            {!loadingAccountLiquidity &&
              (transferAction === Action.Borrow
                ? tzFormatter(myBorrowAvailability, 'tz')
                : tzFormatter(myBorrow, 'tz'))}
          </span>
        </div>
        <div className="row" style={{ marginTop: '30px' }}>
          <div className="col">
            <label>Borrow balance</label>
          </div>
          <div className="col is-right">
            {loadingAccountLiquidity && (
              <Loader visible={true} type="ThreeDots" color="#14854f" height={18} width={18} />
            )}
            {!loadingAccountLiquidity && (
              <BalanceVariationItem
                amountFrom={myBorrow}
                amountTo={
                  amount &&
                  (transferAction === Action.Borrow
                    ? myBorrow.plus(amount)
                    : myBorrow.minus(amount))
                }
              />
            )}{' '}
          </div>
        </div>
        <div className="row" style={{ marginTop: '5px' }}>
          <div className="col">
            <label>Borrow limit</label>
          </div>
          <div className="col is-right">
            {loadingAccountLiquidity && (
              <Loader visible={true} type="ThreeDots" color="#14854f" height={18} width={18} />
            )}
            {!loadingAccountLiquidity && (
              <BalanceVariationItem
                amountFrom={myBorrowAvailability}
                amountTo={
                  amount &&
                  (transferAction === Action.RepayBorrow
                    ? myBorrowAvailability.plus(amount)
                    : myBorrowAvailability.minus(amount))
                }
              />
            )}{' '}
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
          <button disabled={disableButtonCancel} onClick={close} className="button">
            Cancel
          </button>
        </footer>
      </div>
    </ModalWrapper>
  )
}
