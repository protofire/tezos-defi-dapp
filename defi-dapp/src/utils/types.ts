export enum Action {
  Supply = 'Supply',
  Withdraw = 'Withdraw',
}

export interface Account {
  amount: string
  email: string
  mnemonic: Array<string>
  password: string
  pkh: string
  secret: string
}
