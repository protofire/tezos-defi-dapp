import React from 'react'

import { CardBalance } from './cardBalance.component'

export const Balances = () => {
  return (
    <div className="row is-center is-vertical-align">
      <div className="col-6 is-right">
        <CardBalance title="My supply balance" value={10000} symbol="tez" />
      </div>
      <div className="col-6">
        <CardBalance title="My borrow balance" value={10000} symbol="tez" />
      </div>
    </div>
  )
}
