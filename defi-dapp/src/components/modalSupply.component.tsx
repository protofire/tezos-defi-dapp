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
import { BetterCallDevTransaction } from './betterCallDev.component'
import { Tab } from './tab.component'
import { BalanceVariationItem } from './balanceVariation.component'
import { tzFormatter } from '../utils/tool'
import { ModalAction } from '../utils/types'

interface Props extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  poolService: PoolService
  account: Maybe<Account>
}

interface SupplyBalance {
  mySupply: BigNumber
  myBorrowLimit: BigNumber
  myBorrowLimitWithAmount: BigNumber
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
    if (!account) return

    const { email, password, mnemonic } = account
    const signer = InMemorySigner.fromFundraiser(email, password, mnemonic.join(' '))
    const accountAddress = await signer.publicKeyHash()

    const accountBalance = await poolService.getTezosBalance(accountAddress)
    setAmount(accountBalance)
  }

  const submit = async () => {
    if (!amount) return

    setLoadingTransferTransaction(true)
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
    setLoadingTransferTransaction(false)

  }

  const disableButton = !account || !amount || (amount && amount.isZero()) || loadingTransferTransaction

  return (
    <ModalWrapper isOpen={isOpen} onRequestClose={onClose}>
      <div className="card">
        <header className="is-center">
          <h4>{modalAction}</h4>
        </header>
        <div className="row is-center">
          <nav className="tabs">
            <Tab
              action={ModalAction.Supply}
              callback={() => setModalAction(ModalAction.Supply)}
              active={modalAction === ModalAction.Supply}
            />
            <Tab
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
              <BalanceVariationItem
                  amountFrom={mySupply}
                  amountTo={amount && mySupply.plus(amount)}
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
              <BalanceVariationItem
                amountFrom={myBorrowLimit}
                amountTo={amount && myBorrowLimitWithAmount}
              />
            )}
          </div>
        </div>
        <footer className="row is-right" style={{ marginTop: '30px' }}>
          <button
            className="button primary"
            disabled={disableButton}
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
