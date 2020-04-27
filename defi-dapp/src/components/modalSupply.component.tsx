import React, { HTMLAttributes, useState } from 'react'

import { ModalWrapper } from './modalWrapper.component'

interface Props extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
}

enum ModalAction {
  Supply = 'Supply',
  Withdraw = 'Withdraw',
}

export const ModalSupply = (props: Props) => {
  const { onClose, isOpen } = props

  const [modalAction, setModalAction] = useState<ModalAction>(ModalAction.Supply)

  return (
    <ModalWrapper isOpen={isOpen} onRequestClose={onClose}>
      <div className="card">
        <header className="is-center">
          <h4>{modalAction}</h4>
        </header>
        <div className="row is-center">
          <nav className="tabs">
            {/*eslint-disable-next-line*/}
            <a
              style={{ cursor: 'pointer' }}
              onClick={() => setModalAction(ModalAction.Supply)}
              className={`${modalAction === ModalAction.Supply ? 'active' : ''}`}
            >
              {ModalAction.Supply}
            </a>
            {/*eslint-disable-next-line*/}
            <a
              style={{ cursor: 'pointer' }}
              onClick={() => setModalAction(ModalAction.Withdraw)}
              className={`${modalAction === ModalAction.Withdraw ? 'active' : ''}`}
            >
              {ModalAction.Withdraw}
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
            <label>Supply balance</label>
          </div>
          <div className="col is-right">
            <label>0 tez</label>
          </div>
        </div>
        <div className="row" style={{ marginTop: '5px' }}>
          <div className="col">
            <label>Borrow limit</label>
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
