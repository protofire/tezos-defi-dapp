type action is
| Increment of (int)
| Decrement of (int)
| Reset of (unit)

type store is int

type return is list (operation) * store

const emptyOps: list(operation) = list end

function increment (const value : int ; var store : store) : return is
    block { 
        store := store + value 
    } with (emptyOps, store);

function decrement (const value : int ; var store : store) : return is
    block { 
        store := store - value 
    } with (emptyOps, store);

function reset (var store : store) : return is
    block { 
        store := 0
    } with (emptyOps, store);

function main (const action : action ; const store : store) : return is
    block { 
      skip 
    }  with case action of
        | Increment(n) -> increment(n, store)
        | Decrement(n) -> decrement(n, store)
        | Reset(n) -> reset(store)
    end;

