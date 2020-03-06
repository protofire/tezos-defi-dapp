type balanceAmount is nat;

type action is
| Allowance of (address * address)
| Transfer of (address * address * balanceAmount)
| Approve of (address * balanceAmount)
| BalanceOf of (address)
| TotalSupply of (unit)
| Mint of (balanceAmount)
| Burn of (balanceAmount)

type account is record
  balance: balanceAmount;
  allowances: map(address, balanceAmount);
end

type store is record
  owner: address;
  totalSupply: balanceAmount;
  accounts: big_map(address, account);
end

type return is list(operation) * store;

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
    // TODO add transaction
  } with (emptyOps, store);

function isAllowed (const addressOwner: address; const addressSpender: address; const value : balanceAmount; var store : store) : bool is
  block {
    var isAllowed: bool := False;
    if sender =/= addressOwner then block {
      const storeAccountOwner: account = getAccount(addressOwner, store.accounts);
      var allowedAmount: balanceAmount :=  getAllowance(addressSpender, storeAccountOwner.allowances);
      isAllowed := allowedAmount >= value;
    }
    else isAllowed := True;
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

function transfer (const addressFrom: address; const addressTo: address; const value: balanceAmount; var store : store) : return is
  block {
    // If accountFrom = accountDestination transfer is not necessary
    if addressFrom = addressTo then skip;
    else block {
      // Check if accountFrom allowed to spend value
      case isAllowed(addressFrom, addressTo, value, store) of 
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

      const addressToAccount: account = getAccount(addressTo, store.accounts);
      addressToAccount.balance := abs(addressToAccount.balance - value);  // ensure non negative
      store.accounts[addressTo] := addressToAccount;

      // Update allowances
      case store.accounts[addressFrom] of
        | None -> skip
        | Some(account) -> block {
            case account.allowances[addressTo] of
              | None -> skip
              | Some(allowanceAmount) -> block {
                  account.allowances[addressTo] :=  abs(allowanceAmount - value);
                  store.accounts[addressFrom] := record balance = addressFromAccount.balance; allowances = account.allowances; end;
                }
            end;
          }
      end;
    }
  } with (emptyOps, store);

function mint (const value : balanceAmount ; var store : store) : return is
 block {
  // Fail if is not the owner
  if sender =/= store.owner then failwith("You must be the owner of the contract to mint tokens");
  else block {
    var ownerAccount: account := record 
        balance = 0n;
        allowances = (map end : map(address, balanceAmount));
    end;
    case store.accounts[store.owner] of
    | None -> skip
    | Some(n) -> ownerAccount := n
    end;

    // Update the owner balance and totalSupply
    ownerAccount.balance := ownerAccount.balance + value;
    store.accounts[store.owner] := ownerAccount;
    store.totalSupply := store.totalSupply + value;
  }
 } with (emptyOps, store)

function burn (const value : balanceAmount ; var store : store) : return is
 block {
  // Fail if is not the owner
  if sender =/= store.owner then failwith("You must be the owner of the contract to burn tokens");
  else block {
    var ownerAccount: account := record 
        balance = 0n;
        allowances = (map end : map(address, balanceAmount));
    end;
    case store.accounts[store.owner] of
    | None -> skip
    | Some(n) -> ownerAccount := n
    end;

    // Check that the owner can spend that much
    if value > ownerAccount.balance 
    then failwith ("Owner balance is too low");
    else skip;

    // Check totalSupply
    if value > store.totalSupply 
    then failwith ("TotalSupply is too low");
    else skip;

    // Update balances and totalSupply
    ownerAccount.balance := abs(ownerAccount.balance - value);
    store.accounts[store.owner] := ownerAccount;
    store.totalSupply := abs(store.totalSupply - value);
  }
 } with (emptyOps, store)


function balanceOf (const addressOwner: address; var store : store) : return is
  block {
    const addressOwnerAccount: account = getAccount(addressOwner, store.accounts);
    const addressOwnerBalance: balanceAmount = addressOwnerAccount.balance;
    //TODO add transaction
  } with (emptyOps, store);

function totalSupply (var store : store) : return is
  block {
    var totalSupply: balanceAmount := store.totalSupply;
    // TODO add transaction
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
    | Mint(n) -> mint(n, store)
    | Burn(n) -> burn(n, store)
    end;