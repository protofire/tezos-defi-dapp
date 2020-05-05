import React, { HTMLAttributes, useState } from 'react'
import { BigNumberInput } from 'big-number-input'
import BigNumber from 'bignumber.js'
import { useToasts } from 'react-toast-notifications'
import Loader from 'react-loader-spinner'

import { ModalWrapper } from './modalWrapper.component'
import { PoolService } from '../services/poolContract.service'
import { BetterCallDevTransaction } from './betterCallDev.component'
import { Tab } from './tab.component'
import { BalanceVariationItem } from './balanceVariation.component'
import { tzFormatter } from '../utils/tool'
import { Action, Account } from '../utils/types'
import { useAccountLiquidity } from '../hooks/accountLiquidity.hook'

interface Props extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  poolService: PoolService
  account: Account
}

const DepositMessage = ({ hash, amount }: { hash: string; amount: BigNumber }) => {
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

export const ModalSupply = (props: Props) => {
  const { onClose, isOpen, poolService, account } = props

  const { addToast } = useToasts()

  const [amount, setAmount] = useState<Maybe<BigNumber>>(null)
  const [loadingAccountLiquidity, setLoadingAccountLiquidity] = useState<boolean>(false)
  const [loadingTransferTransaction, setLoadingTransferTransaction] = useState<boolean>(false)
  const [modalAction, setModalAction] = useState<Action>(Action.Supply)

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
    modalAction,
    amount,
    () => {
      setLoadingAccountLiquidity(true)
    },
    () => {
      setLoadingAccountLiquidity(false)
    },
  )

  const setMax = async () => {
    if (modalAction === Action.Supply) {
      setAmount(amountAvailableToDeposit)
    } else {
      setAmount(amountAvailableToWithdraw)
    }
  }

  const submit = async () => {
    if (!amount) return

    setLoadingTransferTransaction(true)
    if (modalAction === Action.Supply) {
      let operation: any
      try {
        operation = await poolService.madeDeposit(amount)
        await operation.confirmation()

        const content = <DepositMessage hash={operation.hash} amount={amount} />

        addToast(content, { appearance: 'success', autoDismiss: true })
      } catch (err) {
        // eslint-disable-next-line
        console.error(err.message)
        addToast(`There is an error adding a deposit.`, { appearance: 'error', autoDismiss: true })
      }
    }
    setLoadingTransferTransaction(false)
  }

  const callbackSupply = () => {
    setModalAction(Action.Supply)
    if (amount) {
      setAmount(null)
    }
  }

  const callbackWithdraw = () => {
    setModalAction(Action.Withdraw)
    if (amount) {
      setAmount(null)
    }
  }

  const disableButton =
    !amount ||
    (amount && amount.isZero()) ||
    loadingTransferTransaction ||
    loadingAccountLiquidity ||
    (modalAction === Action.Supply && !isAllowedToDeposit) ||
    (modalAction === Action.Withdraw && !isAllowedToWithdraw)

  return (
    <ModalWrapper isOpen={isOpen} onRequestClose={onClose}>
      <div className="card">
        <header className="is-center">
          <h4>{modalAction}</h4>
        </header>
        <div className="row is-center">
          <nav className="tabs">
            <Tab
              action={Action.Supply}
              callback={callbackSupply}
              active={modalAction === Action.Supply}
            />
            <Tab
              action={Action.Withdraw}
              callback={callbackWithdraw}
              active={modalAction === Action.Withdraw}
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
            {loadingAccountLiquidity && (
              <Loader visible={true} type="ThreeDots" color="#14854f" height={18} width={18} />
            )}
            {!loadingAccountLiquidity && (
              <BalanceVariationItem
                amountFrom={mySupply}
                amountTo={
                  amount &&
                  (modalAction === Action.Withdraw ? mySupply.minus(amount) : mySupply.plus(amount))
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
                amountTo={amount && myBorrowLimitWithAmount}
              />
            )}
          </div>
        </div>
        <footer className="row is-right" style={{ marginTop: '30px' }}>
          <button className="button primary" disabled={disableButton} onClick={submit}>
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
