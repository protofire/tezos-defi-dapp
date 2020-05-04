import React from 'react'
import BigNumber from 'bignumber.js'

import {tzFormatter} from "../utils/tool"

interface BalanceVariationItem {
    amountFrom: BigNumber
    amountTo: Maybe<BigNumber>
}

export const BalanceVariationItem = (props: BalanceVariationItem) => {
    const { amountFrom, amountTo } = props
    return (
        <>
            {!amountTo && <label>{tzFormatter(amountFrom, 'tz')}</label>}
            {amountTo && !amountTo.isZero() && (
                <>
                    <label>{tzFormatter(amountFrom, 'tz')}</label>
                    &nbsp;
                    <img
                        src="https://icongr.am/feather/arrow-right.svg?size=16&amp;color=14854f"
                        alt="icon"
                    />
                    &nbsp;
                    <label>{tzFormatter(amountTo, 'tz')}</label>
                </>
            )}
        </>
    )
}