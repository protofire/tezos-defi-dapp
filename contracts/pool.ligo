#include "./utils/conversions.ligo"
#include "./utils/math.ligo"
#include "./partials/tokenActions.ligo"

type tokenInformation is record
  contractAddress: address;
  tokenDecimals: nat;
end

type balanceInfo is record
  tezAmount: tez;
  blockTimestamp: timestamp;
end

type exchangeRatioInformation is record
  ratio: nat;
  blockTimestamp: timestamp;
end

type action is
| Deposit of (unit)
| Withdraw of (nat)
| Borrow of (nat)
| RepayBorrow of (unit)
| AddLiquidity of (unit)
| UpdateExchangeRatio of (nat)
| UpdateCollateralRatio of (nat)
| UpdateTokenAddress of (address)
| UpdateTokenDecimals of (nat)
| GetExchangeRatio of (unit * contract(exchangeRatioInformation))
| GetBalanceOf of (address * contract(balanceInfo))

type store is record  
  owner: address;
  deposits: big_map(address, balanceInfo);
  borrows: big_map(address, balanceInfo);
  exchangeRatio: exchangeRatioInformation; // Between TEZ and the pToken, this must be variable, but for now is ok
  collateralRatio: nat; // The collateral ratio that borrows must maintain (e.g. 2 implies 2:1), this represents the percentage of supplied value that can be actively borrowed at any given time.
  borrowInterest: nat;
  liquidity: tez;
  token: tokenInformation;
end

const emptyOps: list(operation) = list end;

type return is list(operation) * store

function calculateDepositInterest(const elapsedBlocks: int; const deposit: tez; var store: store): tez is
  block {
    const anualBlocks: int = 522119;
    
    const accruedInterest: int = (elapsedBlocks * 100) / anualBlocks;
    const depositAsNat: nat = tezToNatWithMutez(deposit);
    const depositAsInt: int = natToInt(depositAsNat);
    const accruedTezAsInt: int = (accruedInterest * natToInt(store.exchangeRatio.ratio) * depositAsInt)/10000;
    const newDepositAsInt: int = depositAsInt + accruedTezAsInt;

    const interest: tez = natToMutez(abs(newDepositAsInt));

  } with interest

function incrementExchangeRatio(var store: store): store is
  block {
    const elapsedBlocks: int = now - store.exchangeRatio.blockTimestamp;
    if (elapsedBlocks < 10000)
      then skip;
      else block {
        var ratioValue : nat := store.exchangeRatio.ratio + 1n;
        patch store.exchangeRatio with record [ ratio = ratioValue ]
      }
  } with store

function incrementBorrowInterest(var store: store): store is
  block {
    var borrowInterest: nat := store.borrowInterest + 1n;
    store.borrowInterest := borrowInterest;
  } with store

function decrementBorrowInterest(var store: store): store is
  block {
    // Subtraction of two nats yields an int
    if store.borrowInterest > 0n 
    then block {
      var borrowInterest: nat := intToNat(store.borrowInterest - 1n);
      store.borrowInterest := borrowInterest;
    }
    else skip;
  } with store

function updateExchangeRatio(const value : nat ; var store : store) : return is
 block {
  // Fail if is not the owner
  if (sender =/= store.owner) 
    then failwith("You must be the owner of the contract to update the exchange ratio");
    else block {
      patch store.exchangeRatio with record [ratio = value]
    }
 } with (emptyOps, store)

 function updateCollateralRatio(const value : nat ; var store : store) : return is
 block {
  // Fail if is not the owner
  if (sender =/= store.owner) 
    then failwith("You must be the owner of the contract to update the collateral ratio");
    else block {
      store.collateralRatio := value;
    }
 } with (emptyOps, store)

function updateTokenAddress(const contractAddress : address ; var store : store) : return is
 block {
  // Fail if is not the owner
  if (sender =/= store.owner) 
    then failwith("You must be the owner of the contract to update the token address");
    else  block {
      patch store.token with record [contractAddress = contractAddress]
    }
 } with (emptyOps, store)

function updateTokenDecimals(const tokenDecimals : nat ; var store : store) : return is
 block {
  // Fail if is not the owner
  if (sender =/= store.owner) 
    then failwith("You must be the owner of the contract to update the token decimals");
    else  block {
      patch store.token with record [tokenDecimals = tokenDecimals]   
    }
 } with (emptyOps, store)

function tokenProxy (const action : tokenAction; const store : store): operation is
  block {
    const tokenContract: contract (tokenAction) =
      case (Tezos.get_contract_opt (store.token.contractAddress) : option (contract (tokenAction))) of
        Some (contract) -> contract
      | None -> (failwith ("Contract not found.") : contract (tokenAction))
      end;
    const proxyOperation : operation = Tezos.transaction (action, 0mutez, tokenContract);
  } with proxyOperation

function getDeposit(var store: store): balanceInfo is 
  block {
    var depositsMap: big_map(address, balanceInfo) := store.deposits;
    var deposit: option(balanceInfo) := depositsMap[sender];
  } with
  case deposit of          
    | Some(depositItem) -> depositItem
    | None -> record tezAmount = 0tez; blockTimestamp = now; end
  end;

function getBorrow(var store: store): balanceInfo is 
  block {
    var borrowsMap: big_map(address, balanceInfo) := store.borrows;
    var borrow: option(balanceInfo) := borrowsMap[sender];
  } with
  case borrow of          
    | Some(borrowItem) -> borrowItem
    | None -> record tezAmount = 0tez; blockTimestamp = now; end
  end;

function calculateBorrowInterest(const borrow: tez; var store: store): tez is
  block {
    const borrowAsNat: nat = tezToNatWithMutez(borrow);
    const accruedTezAsNat: nat = (store.borrowInterest * borrowAsNat)/100n;
    const newBorrowAsNat: nat = borrowAsNat + accruedTezAsNat;

    const interest: tez = natToMutez(newBorrowAsNat);

  } with interest

function updateDeposit(var amountDeposit: tez; var store: store): store is 
  block {
    var depositItem: balanceInfo := getDeposit(store);
   
    // calculate interest             
    const elapsedBlocks:int = now - depositItem.blockTimestamp;
    depositItem.tezAmount := depositItem.tezAmount + calculateDepositInterest(elapsedBlocks, depositItem.tezAmount, store) + amountDeposit;
    depositItem.blockTimestamp := now;

    store.deposits[sender] := depositItem;
    store.liquidity := store.liquidity + amountDeposit;
} with store

function updateBorrow(var amountBorrow: tez; var store: store): store is 
  block {
    var borrowItem: balanceInfo := getBorrow(store);
   
    // calculate interest             
    const elapsedBlocks:int = now - borrowItem.blockTimestamp;
    borrowItem.tezAmount := borrowItem.tezAmount + calculateBorrowInterest(borrowItem.tezAmount, store) + amountBorrow;
    borrowItem.blockTimestamp := now;

    store.borrows[sender] := borrowItem;
    if (store.liquidity - amountBorrow) > 0tez 
      then  store.liquidity := store.liquidity - amountBorrow;
      else failwith("Not enough liquidity");
   
} with store

function depositImp(var store: store): return is
  block {
    if amount = 0mutez
      then failwith("No tez transferred!");
      else skip;

    // If ratio is zero, failwith
    if store.exchangeRatio.ratio = 0n
      then failwith("Exchange ratio must not be zero!");
      else skip;

    // Setting the deposit to the sender
    store := updateDeposit(amount, store);

    // TODO, remove this
    store := incrementExchangeRatio(store);

    // TODO, remove this
    store := decrementBorrowInterest(store);

    // TODO: try to get the decimals property from the token contract

    // mintTo tokens to the senderAddress
    const amountInNat: nat = tezToNatWithTz(amount);
    // The user receives a quantity of pTokens equal to the underlying tokens supplied, divided by the current Exchange Rate.
    const decimals: nat = store.token.tokenDecimals;
    const amountInNatExchangeRate: int = natToInt(amountInNat / store.exchangeRatio.ratio) * pow(10, natToInt(decimals));
    const amountToMint: nat = intToNat(amountInNatExchangeRate);

    const tokenProxyMintToOperation: operation = tokenProxy(MintTo(sender, amountToMint), store);
    const operations : list (operation) = list [tokenProxyMintToOperation];
  } with(operations, store)

function withdrawImp(var amountToWithdraw: nat; var store: store): return is
  block {  
    // If the amount is zero, failwith
    if amountToWithdraw = 0n
      then failwith("No amount to withdraw!"); 
      else skip;

    // If ratio is zero, failwith
    if store.exchangeRatio.ratio = 0n
      then failwith("Exchange ratio must not be zero!");
      else skip;

    var depositItem: balanceInfo := getDeposit(store);
    store := updateDeposit(0tez, store);

    // The amount to withdraw must be less than the user's account liquidity 
    // and the pool's available liquidity.
    const amountToWithdrawInTz: tez = natToTz(amountToWithdraw);
    if amountToWithdrawInTz >= depositItem.tezAmount or amountToWithdrawInTz >= store.liquidity
      then failwith("No tez available to withdraw!");
      else skip;

    // Increment exchangeRate
    store := incrementExchangeRatio(store);

    // Increment interest borrow
    store := incrementBorrowInterest(store);

    // Calculate amount to burn
    const amountInTokensToBurn: nat = amountToWithdraw / store.exchangeRatio.ratio;

    // Burn pTokens
    const tokenProxyBurnToOperation: operation = tokenProxy(BurnTo(sender, amountInTokensToBurn), store);

    // Update user's balance
    depositItem.tezAmount := depositItem.tezAmount - amountToWithdrawInTz;
    depositItem.blockTimestamp := now;
    store.deposits[sender] := depositItem;            

    // Update liquidity
    if (store.liquidity - amountToWithdrawInTz) > 0tez 
      then store.liquidity := store.liquidity - amountToWithdrawInTz;
      else failwith("Not enough liquidity");

    // Create the operation to transfer tez to sender
    const receiver : contract (unit) = 
      case (Tezos.get_contract_opt (sender): option(contract(unit))) of 
        Some (contract) -> contract
      | None -> (failwith ("Not a contract") : (contract(unit)))
      end;
    const payoutOperation: operation = Tezos.transaction(unit, amountToWithdrawInTz, receiver);
    const operations : list (operation) = list [payoutOperation];
  } with(operations, store)

function addLiquidity( var store : store) : return is
 block {
  // Fail if is not the owner
  if (sender =/= store.owner) 
    then failwith("You must be the owner of the contract to add liquidity");
    else block {
      if (amount = 0mutez)
        then failwith("No tez transferred!");
        else block {
          store.liquidity := store.liquidity + amount;
        }
    }
} with (emptyOps, store)

function getExchangeRatio (const callback : contract(exchangeRatioInformation); var store : store) : return is
  block {
    var exchangeRatio: exchangeRatioInformation := store.exchangeRatio;

    const exchangeRatioOperation: operation = Tezos.transaction(exchangeRatio, 0mutez, callback); 
    const operations : list (operation) = list [exchangeRatioOperation];
} with (operations, store);


function getBalanceOf (const accountAddress: address; const callback : contract(balanceInfo); var store : store) : return is
  block {
      var operations: list(operation) := nil;

      var depositsMap: big_map(address, balanceInfo) := store.deposits;    
      var senderbalanceInfo: option(balanceInfo) := depositsMap[accountAddress];            

      case senderbalanceInfo of          
        | None -> failwith("Account address not found")
        | Some(di) -> 
          block {
            const balanceOperation: operation = Tezos.transaction(di, 0mutez, callback);
            operations :=  list [balanceOperation];
          }
      end; 
} with (operations, store);

function borrow(var amountToBorrow: nat; var store: store): return is
  block {  
    if amountToBorrow = 0n
      then failwith("No amount to borrow!"); 
      else skip;

    var depositItem: balanceInfo := getDeposit(store);
    store := updateDeposit(0tez, store);

    // Check collateral ratio.
    const depositBalanceInNat: nat = tezToNatWithTz(depositItem.tezAmount);
    const amountOfCollateralAvailable: nat = depositBalanceInNat * store.collateralRatio / 100n;
    const amountToBorrowInTz: tez = natToTz(amountToBorrow);
    if amountToBorrow >= amountOfCollateralAvailable
      then failwith("Amount to borrow is greater than collateral ratio!");
      else skip;

    // Check liquidity  
    if amountToBorrowInTz >= store.liquidity
      then failwith("Amount to borrow is greater than liquidity!");
      else skip;

    // Increment interest borrow
    store := incrementBorrowInterest(store);
    
    // Setting the borrow to the sender
    store := updateBorrow(amountToBorrowInTz, store);

    // Payout transaction to the sender address, with the amount to borrow
    const receiver : contract (unit) = 
      case (Tezos.get_contract_opt (sender): option(contract(unit))) of 
        Some (contract) -> contract
      | None -> (failwith ("Not a contract") : (contract(unit)))
      end;

    const payoutOperation : operation = Tezos.transaction (unit, amountToBorrowInTz, receiver) ;
    const operations : list (operation) = list [payoutOperation];
  } with(operations, store)

function repayBorrow(var store: store): return is
  block {  
    if amount = 0mutez
      then failwith("No tez transferred!");
      else skip;

    var borrowItem: balanceInfo := getBorrow(store);

    store := updateDeposit(0tez, store);
    store := updateBorrow(0tez, store);

    // Check collateral ratio.
    const borrowItemInNat: nat = tezToNatWithTz(borrowItem.tezAmount);
    const borrowItemInTz: tez = natToTz(borrowItemInNat);
    if amount >= borrowItemInTz
      then failwith("Amount to pay is greater than existing borrow amount!");
      else skip;

    // Decrement interest borrow
    store := decrementBorrowInterest(store);

    // Update user's borrow balance
    borrowItem.tezAmount := borrowItem.tezAmount - amount;
    borrowItem.blockTimestamp := now;
    store.borrows[sender] := borrowItem;            

    // Update liquidity
    store.liquidity := store.liquidity + amount;

  } with(emptyOps, store)

function main (const action: action; var store: store): return is
  block {
    skip
  } with case action of
    | Deposit(n) -> depositImp(store)
    | Withdraw(n) -> withdrawImp(n, store)
    | Borrow(n) -> borrow(n, store)
    | RepayBorrow(n) -> repayBorrow(store)
    | UpdateExchangeRatio(n) -> updateExchangeRatio(n, store)
    | UpdateCollateralRatio(n) -> updateCollateralRatio(n, store)
    | AddLiquidity(n) ->  addLiquidity(store)
    | UpdateTokenAddress(n) -> updateTokenAddress(n, store)
    | UpdateTokenDecimals(n) -> updateTokenDecimals(n, store)
    | GetExchangeRatio(n) -> getExchangeRatio(n.1, store)
    | GetBalanceOf(n) -> getBalanceOf(n.0, n.1, store)
  end;  