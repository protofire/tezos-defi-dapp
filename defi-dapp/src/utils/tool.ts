import BigNumber from 'bignumber.js'
import { Tezos } from '@taquito/taquito'
import { InMemorySigner } from '@taquito/signer'

import { TEZOS_RPC as rpc } from '../config/constants'
import { Account } from '../utils/types'

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

export const percentageFormatter = (amount: any) => {
  const bigNum = new BigNumber(amount)
  if (bigNum.isNaN()) {
    return amount
  }

  return `${bigNum.toFixed(4)} %`
}

export const activateAccount = async (account: Account) => {
  try {
    const { email, password, mnemonic, pkh, secret } = account
    const signer = InMemorySigner.fromFundraiser(email, password, mnemonic.join(' '))
    Tezos.setProvider({ rpc, signer })
    const operation = await Tezos.tz.activate(pkh, secret)
    await operation.confirmation()
  } catch (err) {
    // eslint-disable-next-line
    console.error(err.message)
  }
}

interface AccountLiquidity {
  amountToValidate: BigNumber
  depositAmount: BigNumber
  borrowAmount: BigNumber
  collateralRate: BigNumber
  liquidity: BigNumber
}

export const checkAccountLiquidity = async (accountLiquidity: AccountLiquidity) => {
  const {
    amountToValidate,
    depositAmount,
    borrowAmount,
    collateralRate,
    liquidity,
  } = accountLiquidity

  let amountOfCollateralAvailable = new BigNumber(0)
  if (borrowAmount.isZero()) {
    amountOfCollateralAvailable = depositAmount.minus(amountToValidate)
  } else {
    amountOfCollateralAvailable = depositAmount
      .multipliedBy(collateralRate.dividedBy(100))
      .minus(borrowAmount.plus(amountToValidate))
  }

  return {
    isAllowed:
      amountOfCollateralAvailable.isLessThan(0) ||
      amountToValidate.isGreaterThanOrEqualTo(liquidity),
    amountOfCollateralAvailable,
  }
}

export const getAddressFromAccount = async (account: Account) => {
  const { email, password, mnemonic } = account
  const signer = InMemorySigner.fromFundraiser(email, password, mnemonic.join(' '))
  return await signer.publicKeyHash()
}
