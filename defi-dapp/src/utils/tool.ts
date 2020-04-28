import BigNumber from 'bignumber.js'
import { Tezos } from '@taquito/taquito'

export const truncateStringInTheMiddle = (
  str: string,
  strPositionStart: number,
  strPositionEnd: number,
) => {
  const minTruncatedLength = strPositionStart + strPositionEnd
  if (minTruncatedLength < str.length) {
    return `${str.substr(0, strPositionStart)}...${str.substr(
      str.length - strPositionEnd,
      str.length,
    )}`
  }
  return str
}

export const tzFormatter = (amount: any, format: any) => {
  const bigNum = new BigNumber(amount)
  if (bigNum.isNaN()) {
    return amount
  }

  if (format === 'tz') {
    return `${Tezos.format('mutez', 'tz', amount)} ꜩ`
  } else if (format === 'mtz') {
    return `${Tezos.format('mutez', 'mtz', amount)} mꜩ`
  } else {
    return bigNum.toString()
  }
}
