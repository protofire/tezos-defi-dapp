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
import { useAccountLiquidity } from '../hooks/accountLiquidity.hook'
import { SupplyMessage, WithdrawMessage } from './messages.component'

interface Props extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  poolService: PoolService
  account: Account
}

export const ModalSupply = (props: Props) => {
  const { onClose, isOpen, poolService, account } = props

  const { addToast } = useToasts()

  const [amount, setAmount] = useState<Maybe<BigNumber>>(null)
  const [loadingAccountLiquidity, setLoadingAccountLiquidity] = useState<boolean>(false)
  const [loadingTransferTransaction, setLoadingTransferTransaction] = useState<boolean>(false)
  const [transferAction, setTransferAction] = useState<Action>(Action.Supply)

  const {
    mySupply,
    myBorrowLimit,
    myBorrowLimitWithAmount,
    isAllowedToDeposit,
    amountAvailableToDeposit,
    isAllowedToWithdraw,
    amountAvailableToWithdraw,
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
    if (transferAction === Action.Supply) {
      setAmount(amountAvailableToDeposit)
    } else {
      setAmount(amountAvailableToWithdraw)
    }
  }

  const submit = async () => {
    if (!amount) return

    setLoadingTransferTransaction(true)
    if (transferAction === Action.Supply) {
      let operation: any
      try {
        operation = await poolService.madeDeposit(amount)
        await operation.confirmation()

        const content = <SupplyMessage hash={operation.hash} amount={amount} />

        addToast(content, { appearance: 'success', autoDismiss: true })

        onClose()
      } catch (err) {
        // eslint-disable-next-line
        console.error(err.message)
        addToast(`There is an error adding a deposit.`, { appearance: 'error', autoDismiss: true })
      }
    } else {
      let operation: any
      try {
        operation = await poolService.madeWithdraw(amount)
        await operation.confirmation()

        const content = <WithdrawMessage hash={operation.hash} amount={amount} />

        addToast(content, { appearance: 'success', autoDismiss: true })

        onClose()
      } catch (err) {
        // eslint-disable-next-line
            console.error(err.message)
        addToast(`There is an error making a withdraw.`, { appearance: 'error', autoDismiss: true })
      }
    }
    setLoadingTransferTransaction(false)
  }

  const callbackSupply = () => {
    setTransferAction(Action.Supply)
    if (amount) {
      setAmount(null)
    }
  }

  const callbackWithdraw = () => {
    setTransferAction(Action.Withdraw)
    if (amount) {
      setAmount(null)
    }
  }

  const disableButton =
    !amount ||
    (amount && amount.isZero()) ||
    loadingTransferTransaction ||
    loadingAccountLiquidity ||
    (transferAction === Action.Supply && !isAllowedToDeposit) ||
    (transferAction === Action.Withdraw && !isAllowedToWithdraw)

  const errorAmountIsHigherThanBalance = amount && amount.isGreaterThan(amountAvailableToDeposit)

  return (
    <ModalWrapper isOpen={isOpen} onRequestClose={onClose}>
      <div className="card">
        <header className="is-center">
          <h4>{transferAction}</h4>
        </header>
        <div className="row is-center">
          <nav className="tabs">
            <Tab
              action={Action.Supply}
              callback={callbackSupply}
              active={transferAction === Action.Supply}
            />
            <Tab
              action={Action.Withdraw}
              callback={callbackWithdraw}
              active={transferAction === Action.Withdraw}
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
                transferAction === Action.Supply
                  ? amountAvailableToDeposit.toString()
                  : amountAvailableToWithdraw.toString()
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
        <div className={`row is-left ${errorAmountIsHigherThanBalance ? '' : 'is-hidden'}`}>
          <span className="text-error">The amount to supply is higher than balance</span>
        </div>
        <div className="row" style={{ marginTop: '30px' }}>
          <div className="col">
            <label>Supply balance</label>
          </div>
          <div className="col is-right">
            {loadingAccountLiquidity && (
              <Loader visible={true} type="ThreeDots" color="#14854f" height={18} width={18} />
            )}
            {!loadingAccountLiquidity && (
              <BalanceVariationItem
                amountFrom={mySupply}
                amountTo={
                  amount &&
                  (transferAction === Action.Withdraw
                    ? mySupply.minus(amount)
                    : mySupply.plus(amount))
                }
              />
            )}
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
                amountFrom={myBorrowLimit}
                amountTo={
                  amount &&
                  (transferAction === Action.Withdraw
                    ? myBorrowLimit.minus(amount)
                    : myBorrowLimitWithAmount)
                }
              />
            )}
          </div>
        </div>
        <footer className="row is-right" style={{ marginTop: '30px' }}>
          <GasEstimation amount={amount} action={transferAction} poolService={poolService} />
          <button
            className="button primary"
            disabled={disableButton}
            onClick={submit}
            style={{ marginLeft: '1rem' }}
          >
            {account && !loadingTransferTransaction && transferAction}
            {!account && !loadingTransferTransaction && 'Please connect to your account'}
            {loadingTransferTransaction && 'Waiting...'}
          </button>
          <button onClick={onClose} className="button">
            Cancel
          </button>
        </footer>
      </div>
    </ModalWrapper>
  )
}
