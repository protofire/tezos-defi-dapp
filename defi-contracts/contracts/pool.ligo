#include "./utils/conversions.ligo"
#include "./utils/math.ligo"
#include "./partials/tokenActions.ligo"
#include "./partials/poolActions.ligo"
#include "./partials/poolTypes.ligo"
#include "./partials/poolInterest.ligo"

const emptyOps: list(operation) = list end

type return is list(operation) * store

function tokenProxy (const action : tokenAction; const store : store): operation is
  block {
    const tokenContract: contract (tokenAction) =
      case (Tezos.get_contract_opt (store.token.contractAddress) : option (contract (tokenAction))) of
        | Some (contractAction) -> contractAction
        | None -> (failwith ("Contract not found.") : contract (tokenAction))
      end;
    const proxyOperation : operation = Tezos.transaction (action, 0mutez, tokenContract);
  } with proxyOperation;

function getBorrow(var store: store): balanceInfo is
  case store.borrows[sender] of          
    | Some(borrowItem) -> borrowItem
    | None -> record tezAmount = 0tez; blockTimestamp = now; end
  end; attributes ["inline"];

function getDeposit(var store: store): balanceInfo is
  case store.deposits[sender] of          
    | Some(depositItem) -> depositItem
    | None -> record tezAmount = 0tez; blockTimestamp = now; end
  end; attributes ["inline"];

function checkAccountLiquidity(var amountToValidate: tez; var isWithdraw: bool; var store: store): unit is
  block {
    // account liquidity is defined as the total estimated tez value of an account's collateral
    // supply balances multiplied by the protocol collateral rate factor, 
    // minus the total value of that account's borrow balances

    var depositAccount: balanceInfo := getDeposit(store);
    var borrowAccount: balanceInfo := getBorrow(store);

    const depositAmount: tez = depositAccount.tezAmount;
    const borrowAmount: tez = borrowAccount.tezAmount;

    var amountOfCollateralAvailable: tez := 0tez;
    if borrowAmount = 0tez and isWithdraw
      then amountOfCollateralAvailable := depositAmount - amountToValidate;
      else amountOfCollateralAvailable := depositAmount * store.collateralRate / 100n - borrowAmount + amountToValidate;

    if amountOfCollateralAvailable < 0tez or amountOfCollateralAvailable >= store.liquidity
      then failwith("Amount is greater than liquidity!");
      else skip;
  } with unit;

function depositImp(var store: store): return is
  block {
    if amount = 0mutez
      then failwith("No tez transferred!");
      else skip;

    var operations: list(operation) := list end;

    var accountInfo: balanceInfo := getDeposit(store);

    // calculate interest and update user's balance
    const interest:tez = calculateDepositInterest(accountInfo, store);
    store.deposits[sender] := record tezAmount = accountInfo.tezAmount + amount + interest; blockTimestamp = now; end;
    store.totalDeposits := store.totalDeposits + amount + interest;

    // TODO: try to get the decimals property from the token contract

    // Update liquidity
    store.liquidity := store.liquidity + amount;

    // The user receives a quantity of pTokens equal to the underlying tokens supplied, divided by the current Exchange Rate.
    const amountToMint: nat = (tezToNat(amount) / getExchangeRate(store)) * natPow(10n, store.token.tokenDecimals);

    if amountToMint > 0n
      then block {
        // Increment token supply
        patch store.token with record [tokenSupply = store.token.tokenSupply + amountToMint];
        
        // mintTo tokens to the senderAddress
        operations := list [tokenProxy(MintTo(sender, amountToMint), store)]
      }
      else skip;

  } with(operations, store);

function withdrawImp(var amountToWithdraw: tez; var store: store): return is
  block {  
    // If the amount is zero, failwith
    if amountToWithdraw = 0tez
      then failwith("No amount to withdraw!"); 
      else skip;

    var operations: list(operation) := list end;

   // Check account liquidity
    checkAccountLiquidity(amountToWithdraw, True, store);

    var accountInfo: balanceInfo := getDeposit(store);

    // calculate interest and update user's balance
    const interest:tez = calculateDepositInterest(accountInfo, store);
    store.deposits[sender] := record tezAmount = accountInfo.tezAmount - amountToWithdraw + interest; blockTimestamp = now; end;
    store.totalDeposits := store.totalDeposits - amountToWithdraw + interest;

    // Update liquidity
    store.liquidity := store.liquidity - amountToWithdraw;

    // Calculate amount to burn
    const amountToBurn: nat = tezToNat(amountToWithdraw) / getExchangeRate(store) * natPow(10n, store.token.tokenDecimals);

    if amountToBurn > 0n
      then block {
        case is_nat(store.token.tokenSupply - amountToBurn) of
          | Some (newTokenSupply) -> block {
                // Decrement token supply
                patch store.token with record [tokenSupply = newTokenSupply];
                // Burn pTokens
                operations := tokenProxy(BurnTo(sender, amountToBurn), store) # operations;
              }
          | None -> failwith ("Can't update token supply") 
        end;
      }
      else skip;

    // Create the operation to transfer tez to sender
    const receiver : contract (unit) = 
      case (Tezos.get_contract_opt (sender): option(contract(unit))) of 
        | Some (contractSender) -> contractSender
        | None -> (failwith ("Not a contract") : (contract(unit)))
      end;
    operations := Tezos.transaction(unit, amountToWithdraw, receiver) # operations;
  } with(operations, store); attributes ["inline"];

function addLiquidity( var store : store) : return is
 block {
  if (sender =/= store.owner or amount = 0mutez) 
    then failwith("There was a problem trying to add liquidity");
    else store.liquidity := store.liquidity + amount;
} with (emptyOps, store);

function borrow(var amountToBorrow: tez; var store: store): return is
  block {  
    if amountToBorrow = 0tez
      then failwith("No amount to borrow!"); 
      else skip;

    // Check account liquidity
    checkAccountLiquidity(amountToBorrow, False, store);

    var accountInfo: balanceInfo := getBorrow(store);

    // Calculate interest borrow, and set the borrow to the sender            
    const interestBorrow:tez = calculateBorrowInterest(accountInfo, store);
    store.borrows[sender] := record tezAmount = accountInfo.tezAmount + amountToBorrow + interestBorrow; blockTimestamp = now; end;
    store.totalBorrows := store.totalBorrows + amountToBorrow + interestBorrow;

    // Update liquidity
    store.liquidity := store.liquidity - amountToBorrow;

    // Payout transaction to the sender address, with the amount to borrow
    const receiver : contract (unit) = 
      case (Tezos.get_contract_opt (sender): option(contract(unit))) of 
        | Some (contractSender) -> contractSender
        | None -> (failwith ("Not a contract") : (contract(unit)))
      end;

    const operations : list (operation) = list [Tezos.transaction(unit, amountToBorrow, receiver)];
  } with(operations, store); attributes ["inline"];

function repayBorrow(var store: store): return is
  block {  
    if amount = 0mutez
      then failwith("No tez transferred!");
      else skip;

    var accountInfo: balanceInfo := getBorrow(store);

    // Check if amount is greater than existing borrow
    if amount > accountInfo.tezAmount
      then failwith("Amount to pay is greater than existing borrow amount!");
      else skip;

    // calculate interest borrow and update user's borrow balance
    const interestBorrow:tez = calculateBorrowInterest(accountInfo, store);
    store.borrows[sender] := record tezAmount = accountInfo.tezAmount - amount + interestBorrow; blockTimestamp = now; end;
    store.totalBorrows := store.totalBorrows - amount + interestBorrow;

    // Update liquidity
    store.liquidity := store.liquidity + amount;

  } with(emptyOps, store);

function main (const action: action; var store: store): return is
  block {
    skip
  } with case action of
    | Deposit(n) -> depositImp(store)
    | Withdraw(n) -> withdrawImp(n, store)
    | Borrow(n) -> borrow(n, store)
    | RepayBorrow(n) -> repayBorrow(store)
    | AddLiquidity(n) ->  addLiquidity(store)
  end;  