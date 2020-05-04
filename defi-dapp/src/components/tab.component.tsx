import React from 'react'

import { ModalAction } from '../utils/types'

interface TabProps {
    callback: () => any
    action: ModalAction
    active: boolean
}

export const Tab = (props: TabProps) => {
    const { callback, action, active } = props
    return (
        // eslint-disable-next-line
        <a
            style={{ cursor: 'pointer' }}
            onClick={callback}
            className={`${active ? 'active' : ''}`}
        >
            {action}
        </a>
    )
}