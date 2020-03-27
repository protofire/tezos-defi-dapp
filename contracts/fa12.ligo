#include "./partials/tokenActions.ligo"

type account is record
  balance: nat;
  allowances: map(address, nat);
end

type store is record
  owners: set(address);
  decimals: nat; // Added this property used in the erc20 ethereum specification
  symbol: string; // Added this property used in the erc20 ethereum specification
  name: string; // Added this property used in the erc20 ethereum specification
  totalSupply: nat;
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

function getAllowance(const addressAccount : address ; const allowances : map(address, nat)) : nat is
  block { skip } with
    case allowances[addressAccount] of
      | Some(value) -> value
      | None -> 0n
    end

function allowance (const addressOwner : address; const addressSpender : address; const callback : contract(nat); var store : store) : return is
  block {
    const storeAccountOwner: account = getAccount(addressOwner, store.accounts);
    var allowed: nat :=  getAllowance(addressSpender, storeAccountOwner.allowances); 

    const allowedOperation: operation = transaction(allowed, 0tz, callback);
    operations := list 
        allowedOperation 
    end;
  } with (operations, store);

function isAllowed (const addressOwner : address; const addressSpender : address; const value : nat; var store : store) : bool is
  block {
    const storeAccountOwner: account = getAccount(addressOwner, store.accounts);
    var allowedAmount: nat :=  getAllowance(addressSpender, storeAccountOwner.allowances);
    const isAllowed: bool = allowedAmount >= value;
  } with isAllowed;

function isOwner (const addressOwner : address; var store : store) : bool is
  block {
    const isOwner : bool = store.owners contains addressOwner;
  } with isOwner;  

function updateOwners (var newAddress: address; var owners : set (address)) : set (address) is 
  block {
    patch owners with set [newAddress];
  } with owners;

function addOwner (const ownerAddress : address; var store : store) : return is
  block {
    case isOwner(sender, store) of 
    | False -> failwith ("Sender not allowed to add address")
    | True -> skip
    end;
    store.owners := updateOwners(ownerAddress, store.owners);
    
  } with (emptyOps, store);

function approve (const addressSpender : address; const value : nat; var store : store) : return is
  block {
    // If sender is the spender approving is not necessary
    if sender = addressSpender then skip;
    else block {
        const senderAccount: account = getAccount(sender, store.accounts);
        senderAccount.allowances[addressSpender] := value;
        store.accounts[sender] := senderAccount;
    }
  } with (emptyOps, store);

function transfer (const addressFrom : address; const addressTo : address; const value : nat; var store : store) : return is
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
      addressToAccount.balance := addressToAccount.balance + value;  // ensure non negative
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

function mint (const value : nat ; var store : store) : return is
 block {
  // Fail if is not an owner
  if not isOwner(sender, store) then failwith("You must be an owner of the contract to mint tokens");
  else block {
    var ownerAccount: account := record 
        balance = 0n;
        allowances = (map end : map(address, nat));
    end;
    case store.accounts[sender] of
    | None -> skip
    | Some(n) -> ownerAccount := n
    end;

    // Update the owner balance and totalSupply
    ownerAccount.balance := ownerAccount.balance + value;
    store.accounts[sender] := ownerAccount;
    store.totalSupply := store.totalSupply + value;
  }
 } with (emptyOps, store)

function mintTo (const toAddress: address; const value : nat ; var store : store) : return is
 block {
  // Fail if is not an owner
  if not isOwner(sender, store) then failwith("You must be an owner of the contract to mint tokens");
  else block {
    var toAccount: account := record 
        balance = 0n;
        allowances = (map end : map(address, nat));
    end;
    case store.accounts[toAddress] of
    | None -> skip
    | Some(n) -> toAccount := n
    end;

    // Update the balance and totalSupply
    toAccount.balance := toAccount.balance + value;
    store.accounts[toAddress] := toAccount;
    store.totalSupply := store.totalSupply + value;
  }
 } with (emptyOps, store)

function burn (const value : nat ; var store : store) : return is
 block {
  // Fail if is not an owner
  if not isOwner(sender, store) then failwith("You must be an owner of the contract to burn tokens");
  else block {
    var ownerAccount: account := record 
        balance = 0n;
        allowances = (map end : map(address, nat));
    end;
    case store.accounts[sender] of
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
    store.accounts[sender] := ownerAccount;
    store.totalSupply := abs(store.totalSupply - value);
  }
 } with (emptyOps, store)


function balanceOf (const addressOwner : address; const callback : contract(nat); var store : store) : return is
  block {
    const addressOwnerAccount: account = getAccount(addressOwner, store.accounts);
    const addressOwnerBalance: nat = addressOwnerAccount.balance;

    const addressOwnerBalanceOperation: operation = transaction(addressOwnerBalance, 0tz, callback);
    operations := list 
        addressOwnerBalanceOperation 
    end; 
  } with (operations, store);

function totalSupply (const callback : contract(nat); var store : store) : return is
  block {
    var totalSupply: nat := store.totalSupply;

    const totalSupplyOperation: operation = transaction(totalSupply, 0mutez, callback);
    operations := list 
        totalSupplyOperation 
    end;  
  } with (operations, store);

function decimals (const callback : contract(nat); var store : store) : return is
  block {
    var decimals: nat := store.decimals;

    const decimalsOperation: operation = transaction(decimals, 0mutez, callback);
    operations := list 
        decimalsOperation 
    end;  
} with (operations, store);

function name (const callback : contract(string); var store : store) : return is
  block {
    var name: string := store.name;

    const nameOperation: operation = transaction(name, 0mutez, callback);
    operations := list 
        nameOperation 
    end;  
} with (operations, store);

function symbol (const callback : contract(string); var store : store) : return is
  block {
    var symbol: string := store.symbol;

    const symbolOperation: operation = transaction(symbol, 0mutez, callback);
    operations := list 
        symbolOperation 
    end;  
} with (operations, store);

function main (const action : tokenAction ; const store : store) : return is 
  block {
    if amount =/= 0tz then failwith ("This contract do not accept token amount");
    else skip;
  } with case action of
    GetAllowance(n) -> allowance(n.0, n.1, n.2, store)
    | Transfer(n) -> transfer(n.0, n.1, n.2, store)
    | Approve(n) -> approve(n.0, n.1, store)
    | GetBalance(n) -> balanceOf(n.0, n.1, store)
    | GetTotalSupply(n) -> totalSupply(n.1, store)
    | Mint(n) -> mint(n, store)
    | MintTo(n) -> mintTo(n.0, n.1, store)
    | Burn(n) -> burn(n, store)
    | AddOwner(n) -> addOwner(n, store)
    | Decimals(n) -> decimals(n.1, store)
    | Symbol(n) -> symbol(n.1, store)
    | Name(n) -> name(n.1, store)
    end;