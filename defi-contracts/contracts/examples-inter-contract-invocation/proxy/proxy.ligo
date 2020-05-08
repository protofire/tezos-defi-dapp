type action is
| Increment of (int)
| Decrement of (int)
| Reset of (unit)

type store is unit

type return is list (operation) * store

const dest : address = ("KT1ExEhdgHTzotFdPsp4mhNC6rqK4h6EKUQu" : address)

function main (const action : action; const store : store): return is
  block {
    const counter : contract (action) =
      case (Tezos.get_contract_opt (dest) : option (contract (action))) of
        Some (contract) -> contract
      | None -> (failwith ("Contract not found.") : contract (action))
      end;

    const operationProxy : operation = Tezos.transaction (action, 0tez, counter);
    const operations : list (operation) = list [operationProxy]
  } with (operations, store)