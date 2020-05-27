import BigNumber from 'bignumber.js'
import { useAsyncMemo } from 'use-async-memo'

import { OracleService } from '../services/oracleContract.service'

export const useTezosPrice = (
    oracleService: OracleService,
): BigNumber => {
    const price: BigNumber = useAsyncMemo(
        async () => {
            const price = await oracleService.getAssetPrice('xtz')
            return price
        },
        [oracleService],
        new BigNumber(0),
    )

    return price
}
