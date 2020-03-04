type balanceAmount is nat;

type action is
| Allowance of (address * address)
| Transfer of (address * address * balanceAmount)
| Approve of (address * balanceAmount)
| BalanceOf of (address)
| TotalSupply of (unit)

type account is record
  balance   : balanceAmount;
  allowances: map(address, balanceAmount);
end

type store is record
  totalSupply: balanceAmount;
  accounts: big_map(address, account);
end

type return is list(operation) * store

const emptyOps : list(operation) = list end;

const emptyAllowances : map(address,nat) = map end;

function getAccount (const addressAccount : address ; const accounts: big_map(address, account)) : account is
  block { skip } with
    case accounts[addressAccount] of
      | Some(account) -> account
      | None -> record balance = 0n; allowances = emptyAllowances; end
    end

function getAllowance(const addressAccount : address ; const allowances: map(address, balanceAmount)) : balanceAmount is
  block { skip } with
    case allowances[addressAccount] of
      | Some(value) -> value
      | None -> 0n
    end

function allowance (const addressOwner: address; const addressSpender: address; var store : store) : return is
  block {
    const storeAccountOwner: account = getAccount(addressOwner, store.accounts);
    var allowed: balanceAmount :=  getAllowance(addressSpender, storeAccountOwner.allowances); 
  } with (emptyOps, store);

function isAllowed (const addressOwner: address; const addressSpender: address; const value : balanceAmount; var store : store) : bool is
  block {
    const storeAccountOwner: account = getAccount(addressOwner, store.accounts);
    var allowedAmount: balanceAmount :=  getAllowance(addressSpender, storeAccountOwner.allowances);
    var isAllowed: bool := allowedAmount >= value;
  } with isAllowed;

function approve (const addressSpender: address; const value: balanceAmount; var store : store) : return is
  block {
    // If sender is the spender approving is not necessary
    if sender = addressSpender then skip;
    else block {
        const senderAccount: account = getAccount(sender, store.accounts);
        senderAccount.allowances[addressSpender] := value;
        store.accounts[sender] := senderAccount;
    }
  } with (emptyOps, store);

function transfer (const addressFrom: address; const addressDestination: address; const value: balanceAmount; var store : store) : return is
  block {
    // If accountFrom = accountDestination transfer is not necessary
    if addressFrom = addressDestination then skip;
    else block {
      // Check if accountFrom allowed to spend value
      case isAllowed(addressFrom, addressDestination, value, store) of 
      | False -> failwith ("Sender not allowed to spend token")
      | True -> skip
      end;

      const addressFromAccount: account = getAccount(addressFrom, store.accounts);
      // Check that the accountFrom can spend that much
      if value > addressFromAccount.balance
      then failwith ("Balance is too low");
      else skip;

      // Update balances
      addressFromAccount.balance := abs(addressFromAccount.balance - value);  // ensure non negative
      store.accounts[addressFrom] := addressFromAccount;

      const addressDestinationAccount: account = getAccount(addressDestination, store.accounts);
      addressDestinationAccount.balance := abs(addressDestinationAccount.balance - value);  // ensure non negative
      store.accounts[addressDestination] := addressDestinationAccount;

      // Update allowances
      case store.accounts[addressFrom] of
        | None -> skip
        | Some(account) -> block {
            case account.allowances[addressDestination] of
              | None -> skip
              | Some(allowanceAmount) -> block {
                  account.allowances[addressDestination] :=  abs(allowanceAmount - value);
                  store.accounts[addressFrom] := record balance = addressFromAccount.balance; allowances = account.allowances; end;
                }
            end;
          }
      end;
    }
  } with (emptyOps, store);

function balanceOf (const addressOwner: address; var store : store) : return is
  block {
    const addressOwnerAccount: account = getAccount(addressOwner, store.accounts);
    const addressOwnerBalance: balanceAmount = addressOwnerAccount.balance;
  } with (emptyOps, store);

function totalSupply (var store : store) : return is
  block {
    var totalSupply: balanceAmount := store.totalSupply;
  } with (emptyOps, store);

function main (const action : action ; const store : store) : return is 
  block {
    if amount =/= 0tz then failwith ("This contract do not accept token");
    else skip;
  } with case action of
    Allowance(n) -> allowance(n.0, n.1, store)
    | Transfer(n) -> transfer(n.0, n.1, n.2, store)
    | Approve(n) -> approve(n.0, n.1, store)
    | BalanceOf(n) -> balanceOf(n, store)
    | TotalSupply(n) -> totalSupply(store)
    end;