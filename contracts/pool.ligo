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

function getSender(const mock: bool): address is
  block {
    var senderAddress: address := sender;  
    if mock 
      then senderAddress := ("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address);
      else skip
  } with(senderAddress)

function calculateDepositInterest(const elapsedBlocks: int; const deposit: tez; var store: store): tez is
  block {
    const anualBlocks: int = 522119;
    
    const accruedInterest: int = (elapsedBlocks * 100) / anualBlocks;
    const depositAsNat: nat = tezToNatWithMutez(deposit);
    const depositAsInt: int = natToInt(depositAsNat);
    const accruedTezAsInt: int = (accruedInterest * natToInt(store.exchangeRatio.ratio) * depositAsInt)/10000;
    const newDepositAsInt: int = depositAsInt + accruedTezAsInt;

    const interest: tez = natToMutez(abs(newDepositAsInt));

  } with(interest)

function incrementExchangeRatio(var store: store): unit is
  block {
    const elapsedBlocks: int = now - store.exchangeRatio.blockTimestamp;
    if (elapsedBlocks < 10000)
      then skip;
      else block {
        var ratioValue : nat := store.exchangeRatio.ratio + 1n;
        patch store.exchangeRatio with record [ ratio = ratioValue ]
      }
  } with (unit)

function incrementBorrowInterest(var store: store): unit is
  block {
    var borrowInterest: nat := store.borrowInterest + 1n;
    store.borrowInterest := borrowInterest;
  } with (unit)

function decrementBorrowInterest(var store: store): unit is
  block {
    // Subtraction of two nats yields an int
    var borrowInterest: nat := intToNat(store.borrowInterest - 1n);
    store.borrowInterest := borrowInterest;
  } with (unit)

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

function getDeposit(var senderAddress: address; var store: store): balanceInfo is 
  block {
    var depositsMap: big_map(address, balanceInfo) := store.deposits;
    var deposit: option(balanceInfo) := depositsMap[senderAddress];
  } with
  case deposit of          
    | Some(depositItem) -> depositItem
    | None -> record tezAmount = 0tez; blockTimestamp = now; end
  end;

function getBorrow(var senderAddress: address; var store: store): balanceInfo is 
  block {
    var borrowsMap: big_map(address, balanceInfo) := store.borrows;
    var borrow: option(balanceInfo) := borrowsMap[senderAddress];
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

  } with(interest)

function updateDeposit(var senderAddress: address; var amountDeposit: tez; var store: store): balanceInfo is 
  block {
    var depositItem: balanceInfo := getDeposit(senderAddress, store);
   
    // calculate interest             
    const elapsedBlocks:int = now - depositItem.blockTimestamp;
    depositItem.tezAmount := depositItem.tezAmount + calculateDepositInterest(elapsedBlocks, depositItem.tezAmount, store) + amountDeposit;
    depositItem.blockTimestamp := now;

    store.deposits[senderAddress] := depositItem;
    store.liquidity := store.liquidity + amountDeposit;
} with depositItem

function updateBorrow(var senderAddress: address; var amountBorrow: tez; var store: store): balanceInfo is 
  block {
    var borrowItem: balanceInfo := getBorrow(senderAddress, store);
   
    // calculate interest             
    const elapsedBlocks:int = now - borrowItem.blockTimestamp;
    borrowItem.tezAmount := borrowItem.tezAmount + calculateBorrowInterest(borrowItem.tezAmount, store) + amountBorrow;
    borrowItem.blockTimestamp := now;

    store.borrows[senderAddress] := borrowItem;
    store.liquidity := store.liquidity - amountBorrow;
} with borrowItem

function depositImp(var store: store): return is
  block {
    if amount = 0mutez
      then failwith("No tez transferred!");
      else skip;

    // If ratio is zero, failwith
    if store.exchangeRatio.ratio = 0n
      then failwith("Exchange ratio must not be zero!");
      else skip;

    const senderAddress: address = getSender(False);

    // Setting the deposit to the sender
    var depositItem: balanceInfo := updateDeposit(senderAddress, amount, store);

    // Increment exchangeRatio
    incrementExchangeRatio(store);

    // Decrement interest borrow
    decrementBorrowInterest(store);

    // TODO: try to get the decimals property from the token contract

    // mintTo tokens to the senderAddress
    const amountInNat: nat = tezToNatWithTz(amount);
    // The user receives a quantity of pTokens equal to the underlying tokens supplied, divided by the current Exchange Rate.
    const decimals: nat = store.token.tokenDecimals;
    const amountInNatExchangeRate: int = natToInt(amountInNat / store.exchangeRatio.ratio) * pow(10, natToInt(decimals));
    const amountToMint: nat = intToNat(amountInNatExchangeRate);

    const tokenProxyMintToOperation: operation = tokenProxy(MintTo(senderAddress, amountToMint), store);
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

    const senderAddress: address = getSender(False);
    var depositItem: balanceInfo := updateDeposit(senderAddress, 0tez, store);

    // The amount to withdraw must be less than the user's account liquidity 
    // and the pool's available liquidity.
    const amountToWithdrawInTz: tez = natToTz(amountToWithdraw);
    if amountToWithdrawInTz >= depositItem.tezAmount or amountToWithdrawInTz >= store.liquidity
      then failwith("No tez available to withdraw!");
      else skip;

    // Increment exchangeRate
    incrementExchangeRatio(store);

   // Increment interest borrow
    incrementBorrowInterest(store);

    // Calculate amount to burn
    const amountInTokensToBurn: nat = amountToWithdraw / store.exchangeRatio.ratio;

    // Burn pTokens
    const tokenProxyBurnToOperation: operation = tokenProxy(BurnTo(senderAddress, amountInTokensToBurn), store);

    // Update user's balance
    depositItem.tezAmount := depositItem.tezAmount - amountToWithdrawInTz;
    depositItem.blockTimestamp := now;
    store.deposits[senderAddress] := depositItem;            

    // Update liquidity
    store.liquidity := store.liquidity - amountToWithdrawInTz;

    // Create the operation to transfer tez to sender
    const receiver: contract(unit) = get_contract(senderAddress);
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

    // If ratio is zero, failwith
    if store.exchangeRatio.ratio = 0n
      then failwith("Exchange ratio must not be zero!");
      else skip;

    const senderAddress: address = getSender(False);
    var depositItem: balanceInfo := updateDeposit(senderAddress, 0tez, store);

    // Check collateral ratio.
    const depositBalanceInNat: nat = tezToNatWithTz(depositItem.tezAmount);
    const amountOfCollateralAvailable: nat = depositBalanceInNat * store.collateralRatio / 100n;
    const amountToBorrowInTz: tez = natToTz(amountToBorrow);
    if amountToBorrow >= amountOfCollateralAvailable or amountToBorrowInTz >= store.liquidity
      then failwith("Amount to borrow is greater than collateral ratio!");
      else skip;

    // Check liquidity  
    if amountToBorrowInTz >= store.liquidity
      then failwith("Amount to borrow is greater than liquidity!");
      else skip;

    const senderAddress: address = getSender(False);

    // Setting the borrow to the sender
    var borrowItem: balanceInfo := updateBorrow(senderAddress, amountToBorrowInTz, store);

    // Increment interest borrow
    incrementBorrowInterest(store);

    // Payout transaction to the sender address, with the amount to borrow
    const receiver: contract(unit) = get_contract(senderAddress);
    const payoutOperation : operation = Tezos.transaction (unit, amountToBorrowInTz, receiver) ;
    const operations : list (operation) = list [payoutOperation];
  } with(operations, store)

function main (const action: action; var store: store): return is
  block {
    skip
  } with case action of
    | Deposit(n) -> depositImp(store)
    | Withdraw(n) -> withdrawImp(n, store)
    | Borrow(n) -> borrow(n, store)
    | UpdateExchangeRatio(n) -> updateExchangeRatio(n, store)
    | UpdateCollateralRatio(n) -> updateCollateralRatio(n, store)
    | AddLiquidity(n) ->  addLiquidity(store)
    | UpdateTokenAddress(n) -> updateTokenAddress(n, store)
    | UpdateTokenDecimals(n) -> updateTokenDecimals(n, store)
    | GetExchangeRatio(n) -> getExchangeRatio(n.1, store)
    | GetBalanceOf(n) -> getBalanceOf(n.0, n.1, store)
  end;  