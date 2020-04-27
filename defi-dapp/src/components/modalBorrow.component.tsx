import React, { HTMLAttributes, useState } from 'react'

import { ModalWrapper } from './modalWrapper.component'

interface Props extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
}

enum ModalAction {
  Borrow = 'Borrow',
  Repay = 'Repay',
}

export const ModalBorrow = (props: Props) => {
  const { onClose, isOpen } = props

  const [modalAction, setModalAction] = useState<ModalAction>(ModalAction.Borrow)

  return (
    <ModalWrapper isOpen={isOpen} onRequestClose={onClose}>
      <div className="card">
        <header className="is-center">
          <h4>{modalAction}</h4>
        </header>
        <div className="row is-center">
          <nav className="tabs">
            <a
              style={{ cursor: 'pointer' }}
              onClick={() => setModalAction(ModalAction.Borrow)}
              className={`${modalAction === ModalAction.Borrow ? 'active' : ''}`}
            >
              {ModalAction.Borrow}
            </a>
            <a
              style={{ cursor: 'pointer' }}
              onClick={() => setModalAction(ModalAction.Repay)}
              className={`${modalAction === ModalAction.Repay ? 'active' : ''}`}
            >
              {ModalAction.Repay}
            </a>
          </nav>
        </div>
        <div className="row" style={{ marginTop: '30px' }}>
          <div className="is-center">
            <input />
            <div className="button primary" style={{ marginLeft: '10px' }}>
              Max
            </div>
          </div>
        </div>
        <div className="row" style={{ marginTop: '30px' }}>
          <div className="col">
            <label>Borrow balance</label>
          </div>
          <div className="col is-right">
            <label>0 tez</label>
          </div>
        </div>
        <div className="row" style={{ marginTop: '5px' }}>
          <div className="col">
            <label>Borrow limi</label>
          </div>
          <div className="col is-right">
            <label>0 tez</label>
          </div>
        </div>
        <footer className="row is-right" style={{ marginTop: '30px' }}>
          <div className="button primary">{modalAction}</div>
          <div onClick={onClose} className="button">
            Cancel
          </div>
        </footer>
      </div>
    </ModalWrapper>
  )
}
