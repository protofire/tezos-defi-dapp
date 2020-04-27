import React from 'react'

interface Props {
  title: string
  headers: Array<string>
  values: {
    asset: any
    apy: string
    wallet: number
    custom: any
  }
  onClickRow: () => void
  validTHtoClick: Array<number>
}

export const Table = (props: Props) => {
  const { title, headers, values, onClickRow, validTHtoClick } = props

  return (
    <div className="card bg-light">
      <table>
        <caption>
          <h4>{title}</h4>
        </caption>
        <thead>
          <tr>
            {headers.map((header: string, key: number) => (
              <th key={key}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {Object.values(values).map((value: any, key: number) => {
              const inputProps: Maybe<{
                key: number
                onClick?: () => void
                style?: { cursor: string }
              }> = null

              if (validTHtoClick.includes(key)) {
                inputProps.onClick = onClickRow
                inputProps.style = { cursor: 'pointer' }
              }

              return (
                <th key={key} {...inputProps}>
                  {value}
                </th>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
