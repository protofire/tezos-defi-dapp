import React, { HTMLAttributes } from 'react'

import { ModalWrapper } from './modalWrapper.component'

interface Props extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
}

export const ModalAllow = (props: Props) => {
  const { onClose, isOpen } = props

  return (
    <ModalWrapper isOpen={isOpen} onRequestClose={onClose}>
      <div className="card">
        <header>
          <h4>Card title</h4>
        </header>
        <p>Allow</p>
        <footer className="is-right">
          <div className="button primary">Submit</div>
          <div onClick={onClose} className="button">
            Cancel
          </div>
        </footer>
      </div>
    </ModalWrapper>
  )
}
