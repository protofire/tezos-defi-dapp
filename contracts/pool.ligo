#include "./utils/conversions.ligo"
#include "./utils/math.ligo"
#include "./partials/tokenActions.ligo"

type action is
| Deposit of (unit)
| Withdraw of (nat)
| AddLiquidity of (unit)
| UpdateExchangeRatio of (int)
| UpdateCollateralRatio of (int)
| UpdateTokenAddress of (address)
| UpdateTokenDecimals of (nat)

type depositInfo is record
  tezAmount: tez;
  blockTimestamp: timestamp;
end

type tokenInformation is record
  contractAddress: address;
  tokenDecimals: nat;
end

type store is record  
  owner: address;
  deposits: big_map(address, depositInfo);
  borrows: big_map(address, depositInfo);
  exchangeRatio: int;
  collateralRatio: int; //  The collateral ratio that borrows must maintain (e.g. 2 implies 2:1), this represents the percentage of supplied value that can be actively borrowed at any given time.
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

function calculateInterest(const elapsedBlocks: int; const deposit: tez; var store: store): tez is
  block {
    const anualBlocks: int = 522119;
    
    const accruedInterest: int = (elapsedBlocks * 100) / anualBlocks;
    const depositAsNat: nat = tezToNatWithMutez(deposit);
    const depositAsInt: int = natToInt(depositAsNat);
    const accruedTezAsInt: int = (accruedInterest * store.exchangeRatio * depositAsInt)/10000;
    const newDepositAsInt: int = depositAsInt + accruedTezAsInt;

    const interest: tez = natToMutez(abs(newDepositAsInt));

  } with(interest)

function updateExchangeRatio(const value : int ; var store : store) : return is
 block {
  // Fail if is not the owner
  if (sender =/= store.owner) 
    then failwith("You must be the owner of the contract to update the exchange ratio");
    else block {
      store.exchangeRatio := value;
    }
 } with (emptyOps, store)

 function updateCollateralRatio(const value : int ; var store : store) : return is
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

function depositImp(var store: store): return is
  block {
    var operations: list(operation) := nil;

    if amount = 0mutez
      then failwith("No tez transferred!");
      else block {     
        const senderAddress: address = getSender(False);

        // Setting the deposit to the sender
        var depositsMap: big_map(address, depositInfo) := store.deposits;    
        var senderDepositInfo: option(depositInfo) := depositsMap[senderAddress];            

        case senderDepositInfo of          
          | Some(di) -> 
            block {                 
              const elapsedBlocks:int = now - di.blockTimestamp;
              di.tezAmount := di.tezAmount + calculateInterest(elapsedBlocks, di.tezAmount, store) + amount;
              di.blockTimestamp := now;

              depositsMap[senderAddress] := di;            
              store.deposits := depositsMap;              
              store.liquidity := store.liquidity + amount;  
            }
          | None -> 
            block {
              store.liquidity := store.liquidity + amount;  

              const deposit : depositInfo = record
                tezAmount = amount;
                blockTimestamp = now;
              end;

              depositsMap[senderAddress] := deposit;
              store.deposits := depositsMap;
            }
        end; 

        //TODO: try to get the decimals property from the token contract

        // mintTo tokens to the senderAddress
        const amountInNat: nat = tezToNatWithTz(amount);
        // The user receives a quantity of pTokens equal to the underlying tokens supplied, divided by the current Exchange Rate.
        const decimals: nat = store.token.tokenDecimals;
        const amountInNatExchangeRate: int = (natToInt(amountInNat) / store.exchangeRatio) * pow(10, natToInt(decimals));
        const amountToMint: nat = intToNat(amountInNatExchangeRate);

        const tokenProxyMintToOperation: operation = tokenProxy(MintTo(senderAddress, amountToMint), store);
        operations := list
         tokenProxyMintToOperation
        end;
      }
  } with(operations, store)

function withdrawImp(var amountToWithdraw: nat; var store: store): return is
  block {    
    const senderAddress: address = getSender(False);

    var operations: list(operation) := nil;
        
    var di: depositInfo := get_force(senderAddress, store.deposits);
    const elapsedBlocks:int = now - di.blockTimestamp;
    var withdrawAmount: tez := di.tezAmount + calculateInterest(elapsedBlocks, di.tezAmount, store);

    // TODO add accountLiquidity validation,
    // account collateral * collateral factor - account borrow balance
    if withdrawAmount > store.liquidity
      then failwith("No tez to withdraw!");
      else block {
        // update storage
        var depositsMap: big_map(address, depositInfo) := store.deposits;                
        remove senderAddress from map depositsMap;
        store.deposits := depositsMap;  

        store.liquidity := store.liquidity - withdrawAmount;                              

        // Create the operation to transfer tez to sender
        const receiver: contract(unit) = get_contract(senderAddress);
        const payoutOperation: operation = transaction(unit, withdrawAmount, receiver);
        operations:= list 
           payoutOperation 
        end;          
      }
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

// Entrypoint
function main (const action: action; var store: store): return is
  block {
    skip
  } with case action of
    | Deposit(n) -> depositImp(store)
    | Withdraw(n) -> withdrawImp(n, store)
    | UpdateExchangeRatio(n) -> updateExchangeRatio(n, store)
    | UpdateCollateralRatio(n) -> updateCollateralRatio(n, store)
    | AddLiquidity(n) ->  addLiquidity(store)
    | UpdateTokenAddress(n) -> updateTokenAddress(n, store)
    | UpdateTokenDecimals(n) -> updateTokenDecimals(n, store)
    end;  