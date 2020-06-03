export enum Action {
  Supply = 'Supply',
  Withdraw = 'Withdraw',
  Borrow = 'Borrow',
  RepayBorrow = 'Repay',
}

export interface Account {
  amount: string
  email: string
  mnemonic: Array<string>
  password: string
  pkh: string
  secret: string
}
