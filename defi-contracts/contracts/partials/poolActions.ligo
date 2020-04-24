type action is
| Deposit of (unit)
| Withdraw of (nat)
| Borrow of (nat)
| RepayBorrow of (unit)
| AddLiquidity of (unit)
| GetExchangeRate of (unit * contract(nat))
| GetBalanceOf of (address * contract(tez))
