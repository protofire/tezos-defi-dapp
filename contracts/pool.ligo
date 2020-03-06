#include "./conversions.ligo"

type action is
| Deposit of (unit)
| Withdraw of (unit)
| UpdateExchangeRate of (nat)

type deposit_info is record
  tezAmount: tez;
  blockTimestamp: timestamp;
end

type store is record  
  owner: address;
  exchangeRate: nat;
  interest: tez;
  deposits: big_map(address, deposit_info);
  liquidity: tez;
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

function calculateInterest(const elapsedBlocks: int): tez is
  block {
    const interest: tez = 0tz;

    if(elapsedBlocks >= 100)
       then interest := 1tz;
       else skip
  } with(interest)

function updateExchangeRate(const value : nat ; var store : store) : return is
 block {
  // Fail if is not the owner
  if (sender =/= store.owner) 
    then failwith("You must be the owner of the contract to update the exchange rate");
    else block {
      store.exchangeRate := value;
    }
 } with (emptyOps, store)

function depositImp(var store: store): return is
  block {
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
              di.tezAmount := di.tezAmount + calculateInterest(elapsedBlocks) + amount;
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

              depositsMap[sender] := deposit;
              store.deposits := depositsMap;
            }
        end;     
      }
  } with(emptyOps, store)

function withdrawImp(var store: store): return is
  block {    
    const senderAddress: address = getSender(False);

    var operations: list(operation) := nil;
        
    var di: deposit_info := get_force(senderAddress, store.deposits);
    const elapsedBlocks:int = now - di.blockTimestamp;
    var withdrawAmount: tez := di.tezAmount + calculateInterest(elapsedBlocks);

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

// Entrypoint
function main (const action: action; var store: store): return is
  block {
    skip
  } with case action of
    | Deposit(n) -> depositImp(store)
    | Withdraw(n) -> withdrawImp(store)
    | UpdateExchangeRate(n) -> updateExchangeRate(n, store)
    end;  