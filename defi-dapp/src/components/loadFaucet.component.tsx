import React from 'react'

import { accountContext, Account } from '../state/account.context'

export const LoadFaucet = () => {
  const { setCurrentAccount } = React.useContext(accountContext)

  const fileInput = React.useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (null !== fileInput.current) {
      fileInput.current.click()
    }
  }

  const handleFileChange = (event: any) => {
    const reader = new FileReader()

    reader.onload = (event: any) => {
      const account = JSON.parse(event.target.result)
      setCurrentAccount(account as Account)
    }

    reader.readAsText(event.target.files[0])
  }

  return (
    <>
      <div className="is-vertical-align">
        You can download some faucet from&nbsp;
        <a
          className="is-paddingless"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline' }}
          href="https://faucet.tzalpha.net/"
        >
          here
        </a>
      </div>
      <div className="button primary icon" onClick={handleClick} style={{ zIndex: 0 }}>
        Load faucet&nbsp;
        <img src="https://icongr.am/clarity/upload.svg?size=16&amp;color=ffffff" alt="icon" />
      </div>
      <input
        type="file"
        accept=".json,application/json"
        className="is-hidden"
        onChange={handleFileChange}
        ref={fileInput}
      />
    </>
  )
}
