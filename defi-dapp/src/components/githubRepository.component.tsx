import React from 'react'

import { REPOSITORY } from '../config/constants'

export const GithubRepository = () => {
  return (
    <a href={REPOSITORY} target="_blank" rel="noopener noreferrer">
      <img src="https://icongr.am/devicon/github-original.svg?size=32&amp;" alt="icon" />
    </a>
  )
}
