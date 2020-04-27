import React from 'react'

interface Props {
  title: string
  value: number
  symbol: string
}

export const CardBalance = (props: Props) => {
  const { title, value, symbol } = props
  return (
    <>
      <div className="card bg-light" style={{ width: '300px', height: 'auto' }}>
        <header>
          <h4>{title}</h4>
        </header>
        <footer>
          <h4>
            {value} {symbol}
          </h4>
        </footer>
      </div>
    </>
  )
}
