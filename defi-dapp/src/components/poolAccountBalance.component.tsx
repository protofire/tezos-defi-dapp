import React from 'react'
import { InMemorySigner } from '@taquito/signer'
import { useAsyncMemo } from 'use-async-memo'
import Loader from 'react-loader-spinner'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'
import BigNumber from 'bignumber.js'

import {Account, useConnectedContext} from '../state/connected.context'
import { tzFormatter } from '../utils/tool'
import {PoolService} from "../services/poolContract.service"

interface AccountBalance {
    deposit: BigNumber,
    borrow: BigNumber,
    loading: boolean
}

export const PoolAccountBalanceConnected = ({ poolService, account }: {poolService: PoolService, account: Maybe<Account>}) => {
    const initialValues = {
        deposit: new BigNumber(0),
        borrow: new BigNumber(0),
        loading: true
    }
    const { deposit, borrow, loading } : AccountBalance = useAsyncMemo(
        async () => {
            if (!account) {
                return { ...initialValues, loading: false }
            }

            const { email, password, mnemonic } = account
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
            return { deposit, borrow, loading: false }
        },
        [account],
        initialValues,
    )

    return (
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
    )
}

export const PoolAccountBalanceDisconnected = () => {
    return (
        <div className="card bg-light" style={{ width: '300px', height: 'auto' }}>
            <header>
                <h4>My balances</h4>
            </header>
            <footer>
                <div className="is-center">
                    <Loader visible={true} type="ThreeDots" color="#14854f" height={80} width={80} />
                </div>
            </footer>
        </div>
    )
}

export const PoolAccountBalance = () => {
    const context = useConnectedContext()
    const { poolService, account } = context

    return (
        <>
            {poolService ? <PoolAccountBalanceConnected poolService={poolService} account={account} /> : <PoolAccountBalanceDisconnected/>}
        </>
    )
}
