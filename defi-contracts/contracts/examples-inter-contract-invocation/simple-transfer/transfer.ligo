type store is unit;

type return is list (operation) * store

function main (const toAddress: address; var store: store) : return is
  block {
    if amount = 0tz then failwith ("You must send tez to accomplish the transfer");
    else skip;

    const receiver : contract (unit) = 
        case (Tezos.get_contract_opt (toAddress) : option(contract(unit))) of 
              Some (contract) -> contract
              | None  -> (failwith ("Not a contract") : contract (unit))
        end;
  } with (list[Tezos.transaction(unit, amount, receiver)], store);
