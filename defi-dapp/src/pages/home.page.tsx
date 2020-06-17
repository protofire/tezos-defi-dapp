import React from 'react'
import { ToastProvider } from 'react-toast-notifications'

import { Header } from '../components/header.component'
import { Balances } from '../components/balances.component'
import { Markets } from '../components/markets.component'

import { ConnectedNetwork } from '../state/connected.context'
import { FooterInformation } from '../components/footerInformation.component'

export const HomePage = () => {
  return (
    <ToastProvider>
      <ConnectedNetwork>
        <Header />
        <div className="container" style={{ marginTop: '30px' }}>
          <Balances />
          <Markets />
        </div>
        <footer className="footerInformation" style={{ marginTop: '30px' }}>
          <FooterInformation />
        </footer>
      </ConnectedNetwork>
    </ToastProvider>
  )
}
