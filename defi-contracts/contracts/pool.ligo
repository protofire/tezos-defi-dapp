#include "./utils/conversions.ligo"
#include "./utils/math.ligo"
#include "./partials/tokenActions.ligo"

type tokenInformation is record
  contractAddress: address;
  tokenDecimals: nat;
  tokenSupply: nat;
end

type action is
| Deposit of (unit)
| Withdraw of (nat)
| Borrow of (nat)
| RepayBorrow of (unit)
| AddLiquidity of (unit)
| UpdateCollateralRate of (nat)
| GetExchangeRate of (unit * contract(nat))
| GetBalanceOf of (address * contract(tez))

type balanceInfo is record
  tezAmount: tez;
  blockTimestamp: timestamp;
end

type store is record  
  owner: address;
  deposits: big_map(address, balanceInfo);
  borrows: big_map(address, balanceInfo);
  totalDeposits: tez;
  totalBorrows: tez;
  collateralRate: nat; // The collateral ratio that borrows must maintain (e.g. 2 implies 2:1), this represents the percentage of supplied value that can be actively borrowed at any given time.
  liquidity: tez;
  token: tokenInformation;
end

const emptyOps: list(operation) = list end;

type return is list(operation) * store;

function getExchangeRateInternal(var store: store): nat is 
  block {
    var exchangeRate :nat := 1n;
    if store.token.tokenSupply >= 1n 
      then block {
        const realTokenSupply: nat =  store.token.tokenSupply / intToNat(pow(10, natToInt(store.token.tokenDecimals)));
        exchangeRate := tezToNatWithTz(store.totalDeposits + store.totalBorrows) / realTokenSupply;
      }
      else skip;
  } with exchangeRate;

function getCoefficientInterest(var store: store): nat is 
  block {
    var coefficientInterest :nat := 1n;
    if (store.totalDeposits + store.totalBorrows) > 0tez
      then coefficientInterest := store.totalBorrows / (store.totalDeposits + store.totalBorrows);
      else skip;
  } with coefficientInterest; attributes ["inline"];

function getBorrowInterestRate(var store: store): nat is (2n + getCoefficientInterest(store) * 20n);

function getDepositInterestRate(var store: store): nat is (getBorrowInterestRate(store) * getCoefficientInterest(store));

function calculateBorrowInterest(const accountInfo: balanceInfo; var store: store): tez is 
  block {
    const dailyBlocks: int = 86400; // Seconds x day

    const elapsedBlocks :int = now - accountInfo.blockTimestamp;

    const interest :tez = 0tez;
    if elapsedBlocks > dailyBlocks 
      then block {
        const elapsedDays :int = elapsedBlocks / dailyBlocks; 
        const interestRatePercentage :int = natToInt(getBorrowInterestRate(store) / 100n);
        interest := (accountInfo.tezAmount * intToNat(pow((1 + interestRatePercentage / 365), elapsedDays)) - accountInfo.tezAmount);
      }
      else skip;
  } with interest; attributes ["inline"];

function calculateDepositInterest(const accountInfo: balanceInfo; var store: store): tez is 
  block {
    const dailyBlocks: int = 86400; // Seconds x day

    const elapsedBlocks :int = now - accountInfo.blockTimestamp;

    const interest :tez = 0tez;
    if elapsedBlocks > dailyBlocks 
      then block {
        const elapsedDays :int = elapsedBlocks / dailyBlocks; 
        const interestRatePercentage :int = natToInt(getDepositInterestRate(store) / 100n);
        interest := (accountInfo.tezAmount * intToNat(pow((1 + interestRatePercentage / 365), elapsedDays)) - accountInfo.tezAmount);
      }
      else skip;
  } with interest; attributes ["inline"];

function tokenProxy (const action : tokenAction; const store : store): operation is
  block {
    const tokenContract: contract (tokenAction) =
      case (Tezos.get_contract_opt (store.token.contractAddress) : option (contract (tokenAction))) of
        Some (contractAction) -> contractAction
      | None -> (failwith ("Contract not found.") : contract (tokenAction))
      end;
    const proxyOperation : operation = Tezos.transaction (action, 0mutez, tokenContract);
  } with proxyOperation;

function getBorrow(var store: store): balanceInfo is 
  block {
    var borrowsMap: big_map(address, balanceInfo) := store.borrows;
    var borrow: option(balanceInfo) := borrowsMap[sender];
  } with
  case borrow of          
    | Some(borrowItem) -> borrowItem
    | None -> record tezAmount = 0tez; blockTimestamp = now; end
  end; attributes ["inline"];

function getDeposit(var store: store): balanceInfo is 
  block {
    var depositsMap: big_map(address, balanceInfo) := store.deposits;
    var deposit: option(balanceInfo) := depositsMap[sender];
  } with
  case deposit of          
    | Some(depositItem) -> depositItem
    | None -> record tezAmount = 0tez; blockTimestamp = now; end
  end; attributes ["inline"];

function updateDeposit(var amountToDeposit: tez; var store: store): store is 
  block {
    var accountInfo: balanceInfo := getDeposit(store);
   
    // calculate interest             
    const interest:tez = calculateDepositInterest(accountInfo, store);
    store.deposits[sender] := record tezAmount = accountInfo.tezAmount + interest + amountToDeposit; blockTimestamp = now; end;
    store.totalDeposits := store.totalDeposits + interest + amountToDeposit;
    store.liquidity := store.liquidity + amountToDeposit;
} with store;

function updateBorrow(var amountToBorrow: tez; var store: store): store is 
  block {
    var accountInfo: balanceInfo := getBorrow(store);

    // calculate interest             
    const interest:tez = calculateBorrowInterest(accountInfo, store);
    store.borrows[sender] := record tezAmount = accountInfo.tezAmount + interest + amountToBorrow; blockTimestamp = now; end;
    store.totalBorrows := store.totalBorrows + interest + amountToBorrow;
    store.liquidity := store.liquidity - amountToBorrow;
} with store;

function checkAccountLiquidity(var amountToValidate: nat; var isWithdraw: bool; var store: store): unit is
  block {
    // account liquidity is defined as the total estimated tez value of an account's collateral
    // supply balances multiplied by the protocol collateral rate factor, 
    // minus the total value of that account's borrow balances

    var depositAccount: balanceInfo := getDeposit(store);
    var borrowAccount: balanceInfo := getBorrow(store);

    const depositAmountInInt: int = natToInt(tezToNatWithTz(depositAccount.tezAmount));
    const borrowAmountInInt: int = natToInt(tezToNatWithTz(borrowAccount.tezAmount));

    var amountOfCollateralAvailable: int := 0;
    if borrowAmountInInt = 0 and isWithdraw
      then amountOfCollateralAvailable := depositAmountInInt - amountToValidate;
      else amountOfCollateralAvailable := (depositAmountInInt * natToInt(store.collateralRate) / 100) - (borrowAmountInInt + amountToValidate);

    const amountToValidateInTz: tez = natToTz(amountToValidate);

    if amountOfCollateralAvailable < 0 or amountToValidateInTz >= store.liquidity
      then failwith("Amount is greater than liquidity!");
      else skip;
  } with unit;  attributes ["inline"];

function depositImp(var store: store): return is
  block {
    if amount = 0mutez
      then failwith("No tez transferred!");
      else skip;

    // Setting the deposit to the sender
    store := updateDeposit(amount, store);

    // TODO: try to get the decimals property from the token contract

    // The user receives a quantity of pTokens equal to the underlying tokens supplied, divided by the current Exchange Rate.
    const amountToMint: int = natToInt(tezToNatWithTz(amount) / getExchangeRateInternal(store)) * pow(10, natToInt(store.token.tokenDecimals));

    const amountToMintInNat: nat = intToNat(amountToMint);
    // Increment token supply
    const newTokenSupply :nat = store.token.tokenSupply + amountToMintInNat;
    patch store.token with record [tokenSupply = newTokenSupply];

    // mintTo tokens to the senderAddress
    const tokenProxyMintToOperation: operation = tokenProxy(MintTo(sender, amountToMintInNat), store);
    const operations : list (operation) = list [tokenProxyMintToOperation];
  } with(operations, store);

function withdrawImp(var amountToWithdraw: nat; var store: store): return is
  block {  
    // If the amount is zero, failwith
    if amountToWithdraw = 0n
      then failwith("No amount to withdraw!"); 
      else skip;

    store := updateDeposit(0tez, store);
    store := updateBorrow(0tez, store);

    // Check account liquidity
    checkAccountLiquidity(amountToWithdraw, True, store);

    // Calculate amount to burn
    const amountToBurn: int = natToInt(amountToWithdraw / getExchangeRateInternal(store)) * pow(10, natToInt(store.token.tokenDecimals));

    const amountToBurnInNat: nat = intToNat(amountToBurn);

    // Decrement token supply
    const newTokenSupply :nat = intToNat(store.token.tokenSupply - amountToBurnInNat);
    patch store.token with record [tokenSupply = newTokenSupply];

    // Burn pTokens
    const tokenProxyBurnToOperation: operation = tokenProxy(BurnTo(sender, amountToBurnInNat), store);

    // Update user's balance
    const amountToWithdrawInTz: tez = natToTz(amountToWithdraw);

    var accountInfo: balanceInfo := getDeposit(store);
    store.deposits[sender] := record tezAmount = accountInfo.tezAmount - amountToWithdrawInTz; blockTimestamp = now; end;       
    store.totalDeposits := store.totalDeposits - amountToWithdrawInTz;

    // Update liquidity
    store.liquidity := store.liquidity - amountToWithdrawInTz;

    // Create the operation to transfer tez to sender
    const receiver : contract (unit) = 
      case (Tezos.get_contract_opt (sender): option(contract(unit))) of 
        Some (contractSender) -> contractSender
      | None -> (failwith ("Not a contract") : (contract(unit)))
      end;
    const payoutOperation: operation = Tezos.transaction(unit, amountToWithdrawInTz, receiver);
    const operations : list (operation) = list [tokenProxyBurnToOperation ; payoutOperation];
  } with(operations, store);

function addLiquidity( var store : store) : return is
 block {
  if (sender =/= store.owner or amount = 0mutez) 
    then failwith("There was a problem trying to add liquidity");
    else store.liquidity := store.liquidity + amount;
} with (emptyOps, store); attributes ["inline"];

function getExchangeRate (const callback : contract(nat); var store : store) : return is ( list [Tezos.transaction(getExchangeRateInternal(store), 0mutez, callback)], store);  attributes ["inline"];

function getBalanceOf (const accountAddress: address; const callback : contract(tez); var store : store) : return is
  block {
      var operations: list(operation) := nil;

      var depositsMap: big_map(address, balanceInfo) := store.deposits;    
      var accountInfo: option(balanceInfo) := depositsMap[accountAddress];            

      case accountInfo of          
        | None -> failwith("Account address not found")
        | Some(accountInfoItem) -> operations :=  list [Tezos.transaction(accountInfoItem.tezAmount, 0mutez, callback)]
      end; 
} with (operations, store); attributes ["inline"];

function borrow(var amountToBorrow: nat; var store: store): return is
  block {  
    if amountToBorrow = 0n
      then failwith("No amount to borrow!"); 
      else skip;

    store := updateDeposit(0tez, store);
    store := updateBorrow(0tez, store);
    
    // Check account liquidity
    checkAccountLiquidity(amountToBorrow, False, store);
    
    // Setting the borrow to the sender
    const amountToBorrowInTz: tez = natToTz(amountToBorrow);
    store := updateBorrow(amountToBorrowInTz, store);

    // Payout transaction to the sender address, with the amount to borrow
    const receiver : contract (unit) = 
      case (Tezos.get_contract_opt (sender): option(contract(unit))) of 
        Some (contractSender) -> contractSender
      | None -> (failwith ("Not a contract") : (contract(unit)))
      end;

    const operationTransfer: operation = Tezos.transaction(unit, amountToBorrowInTz, receiver);
    const operations : list (operation) = list [operationTransfer];
  } with(operations, store);

function repayBorrow(var store: store): return is
  block {  
    if amount = 0mutez
      then failwith("No tez transferred!");
      else skip;

    store := updateDeposit(0tez, store);
    store := updateBorrow(0tez, store);

    var accountInfo: balanceInfo := getBorrow(store);

    // Check collateral ratio.
    const borrowItemInNat: nat = tezToNatWithTz(accountInfo.tezAmount);
    const borrowItemInTz: tez = natToTz(borrowItemInNat);
    if amount > borrowItemInTz
      then failwith("Amount to pay is greater than existing borrow amount!");
      else skip;

    // Update user's borrow balance
    store.borrows[sender] :=  record tezAmount = accountInfo.tezAmount - amount; blockTimestamp = now; end;
    store.totalBorrows := store.totalBorrows - amount;

    // Update liquidity
    store.liquidity := store.liquidity + amount;

  } with(emptyOps, store);

 function updateCollateralRate(const value : nat ; var store : store) : return is
  block {
    // Fail if is not the owner
    if (sender =/= store.owner) 
      then failwith("You must be the owner of the contract to update the collateral ratio");
      else store.collateralRate := value;
  } with (emptyOps, store); attributes ["inline"];

function main (const action: action; var store: store): return is
  block {
    skip
  } with case action of
    | Deposit(n) -> depositImp(store)
    | Withdraw(n) -> withdrawImp(n, store)
    | Borrow(n) -> borrow(n, store)
    | RepayBorrow(n) -> repayBorrow(store)
    | UpdateCollateralRate(n) -> updateCollateralRate(n, store)
    | AddLiquidity(n) ->  addLiquidity(store)
    | GetExchangeRate(n) -> getExchangeRate(n.1, store)
    | GetBalanceOf(n) -> getBalanceOf(n.0, n.1, store)
  end;  