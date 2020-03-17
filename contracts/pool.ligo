#include "./conversions.ligo"
#include "./math.ligo"

type action is
| Deposit of (unit)
| Withdraw of (unit)
| AddLiquidity of (unit)
| UpdateExchangeRate of (int)
| UpdateTokenAddress of (address)

// Same action type as in fa12 file, If not will throw an error
type parameter is
| GetAllowance of (address * address * contract(nat))
| Transfer of (address * address * nat)
| Approve of (address * nat)
| GetBalance of (address * contract(nat))
| GetTotalSupply of (unit * contract(nat))
| Mint of (nat)
| MintTo of (address * nat)
| Burn of (nat)
| AddOwner of (address)

type deposit_info is record
  tezAmount: tez;
  blockTimestamp: timestamp;
end

type store is record  
  owner: address;
  exchangeRate: int;
  deposits: big_map(address, deposit_info);
  liquidity: tez;
  tokenAddress: address;
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
    const accruedTezAsInt: int = (accruedInterest * store.exchangeRate * depositAsInt)/10000;
    const newDepositAsInt: int = depositAsInt + accruedTezAsInt;

    const interest: tez = natToMutez(abs(newDepositAsInt));

  } with(interest)

function updateExchangeRate(const value : int ; var store : store) : return is
 block {
  // Fail if is not the owner
  if (sender =/= store.owner) 
    then failwith("You must be the owner of the contract to update the exchange rate");
    else block {
      store.exchangeRate := value;
    }
 } with (emptyOps, store)

function updateTokenAddress(const tokenAddress : address ; var store : store) : return is
 block {
  // Fail if is not the owner
  if (sender =/= store.owner) 
    then failwith("You must be the owner of the contract to update the token address");
    else store.tokenAddress := tokenAddress;
 } with (emptyOps, store)

function tokenProxy (const action : parameter; const store : store): operation is
  block {
    const tokenContract: contract (parameter) =
      case (Tezos.get_contract_opt (store.tokenAddress) : option (contract (parameter))) of
        Some (contract) -> contract
      | None -> (failwith ("Contract not found.") : contract (parameter))
      end;
    const proxyOperation : operation = Tezos.transaction (action, 0tez, tokenContract);
  } with proxyOperation

function depositImp(var store: store): return is
  block {
    var operations: list(operation) := nil;

    if amount = 0mutez
      then failwith("No tez transferred!");
      else block {     
        const senderAddress: address = getSender(False);

        //setting the deposit to the sender
        var depositsMap: big_map(address, deposit_info) := store.deposits;    
        var senderDepositInfo: option(deposit_info) := depositsMap[senderAddress];            

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

              const deposit : deposit_info = record
                tezAmount = amount;
                blockTimestamp = now;
              end;

              depositsMap[senderAddress] := deposit;
              store.deposits := depositsMap;
            }
        end; 

        // mintTo tokens to the senderAddress
        const amountInNat: nat = tezToNatWithTz(amount);
        // The token has 18 decimals, so we need to multiply the amount by 1000000000000000000, we use the pow library
        const amountInNatExchangeRate: int = (natToInt(amountInNat) / store.exchangeRate) * pow(10, 18);
        const amountToMint: nat = intToNat(amountInNatExchangeRate);

        const tokenProxyOperation: operation = tokenProxy(MintTo(senderAddress, amountToMint), store);
        operations := list 
          tokenProxyOperation 
        end;
      }
  } with(operations, store)

function withdrawImp(var store: store): return is
  block {    
    const senderAddress: address = getSender(False);

    var operations: list(operation) := nil;
        
    var di: deposit_info := get_force(senderAddress, store.deposits);
    const elapsedBlocks:int = now - di.blockTimestamp;
    var withdrawAmount: tez := di.tezAmount + calculateInterest(elapsedBlocks, di.tezAmount, store);

    if withdrawAmount > store.liquidity
      then failwith("No tez to withdraw!");
      else block {
        // update storage
        var depositsMap: big_map(address, deposit_info) := store.deposits;                
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
    | Withdraw(n) -> withdrawImp(store)
    | UpdateExchangeRate(n) -> updateExchangeRate(n, store)
    | AddLiquidity(n) ->  addLiquidity(store)
    | UpdateTokenAddress(n) -> updateTokenAddress(n, store)
    end;  