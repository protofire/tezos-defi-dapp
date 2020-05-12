import React from 'react'
import BigNumber from 'bignumber.js'

import { useGasEstimation } from '../hooks/gasEstimation.hook'
import { IconType, Tooltip } from './tooltip/tooltip.component'
import { Action } from '../utils/types'
import { PoolService } from '../services/poolContract.service'

interface Props {
  amount: Maybe<BigNumber>
  action: Action
  poolService: PoolService
}

export const GasEstimation = (props: Props) => {
  const { amount, action, poolService } = props
  const gasEstimation = useGasEstimation(amount, action, poolService)

  let descriptionGasEstimation = `Gas limit: 0<br/>Storage limit: 0<br/>Suggested fee: 0`
  if (gasEstimation) {
    descriptionGasEstimation = `Gas limit: ${gasEstimation.gasLimit} gas units<br/> 
        Storage limit: ${gasEstimation.storageLimit}<br/>  
        Suggested fee: ${gasEstimation.suggestedFeeMutez} mutez`
  }

  return (
    <Tooltip id="gasEstimation" description={descriptionGasEstimation} iconType={IconType.Fuel} />
  )
}
