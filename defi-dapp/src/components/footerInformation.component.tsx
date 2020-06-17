import React from 'react'

import { TOKEN_CONTRACT_ADDRESS, POOL_CONTRACT_ADDRESS } from '../config/constants'
import { ContractLink } from './contractLink.component'
import { DisclaimerWarning } from './disclaimerWarning.component'
import { GithubRepository } from './githubRepository.component'

export const FooterInformation = () => {
  return (
    <div className="row">
      <div className="col is-left">
        <DisclaimerWarning />
      </div>
      <div className="col is-right">
        <p className="is-center">
          <ContractLink address={POOL_CONTRACT_ADDRESS} title="Pool contract" />
          &nbsp;•&nbsp;
          <ContractLink address={TOKEN_CONTRACT_ADDRESS} title="FA 1.2 contract" />
          &nbsp;•&nbsp;
          <GithubRepository />
        </p>
      </div>
    </div>
  )
}
