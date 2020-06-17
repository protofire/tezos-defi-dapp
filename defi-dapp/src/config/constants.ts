export const POOL_CONTRACT_ADDRESS: string = process.env.REACT_APP_POOL_CONTRACT_ADDRESS || ''
export const TOKEN_CONTRACT_ADDRESS: string = process.env.REACT_APP_POOL_CONTRACT_ADDRESS || ''
export const ORACLE_CONTRACT_ADDRESS: string = process.env.REACT_APP_ORACLE_CONTRACT_ADDRESS || ''
export const TEZOS_RPC: string = process.env.REACT_APP_TEZOS_RPC || ''
export const REPOSITORY: string = process.env.REACT_APP_REPOSITORY || ''

export const baseConfig = {
  rpc: TEZOS_RPC,
  config: {
    confirmationPollingIntervalSecond: 2,
  },
}

export const expMantissa = 1.0e6
