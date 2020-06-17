import React from 'react'

interface Props {
  address: string
  title: string
}

export const ContractLink = (props: Props) => {
  const { title, address } = props
  const url = `https://better-call.dev/carthage/${address}`
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {title}
    </a>
  )
}
