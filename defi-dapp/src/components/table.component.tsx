import React from 'react'
import Loader from 'react-loader-spinner'

export interface TableProps {
  title: string
  headers: Array<string>
  values?: {
    asset: any
    apy: string
    wallet: string
    custom?: any
  }
  onClickRow?: () => void
  loading: boolean
}

export const Table = (props: TableProps) => {
  const { title, headers, values, onClickRow, loading } = props

  return (
    <div className="card bg-light">
      <table>
        <caption>
          <h4>{title}</h4>
        </caption>
        <thead style={{ borderBottom: '1px solid black' }}>
          <tr>
            {headers.map((header: string, key: number) => (
              <th key={key}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <th colSpan={headers.length}>
                <div className="is-center">
                  <Loader visible={true} type="ThreeDots" color="#14854f" height={80} width={80} />
                </div>
              </th>
            </tr>
          )}
          {!loading && values && (
            <tr className={`${onClickRow ? 'tr-hover-class normal' : ''}`}>
              {Object.values(values).map((value: any, key: number) => {
                const inputProps: {
                  key: number
                  onClick?: () => void
                  style?: { cursor: string }
                } = { key: key }

                if (onClickRow) {
                  inputProps.onClick = onClickRow
                  inputProps.style = { cursor: 'pointer' }
                }

                // eslint-disable-next-line
                return <th {...inputProps}>{value}</th>
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
