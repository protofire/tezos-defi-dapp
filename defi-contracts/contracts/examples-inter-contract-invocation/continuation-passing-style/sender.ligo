type request is record
  callback : contract(int)
end

type action is GetBar of (request)

type store is record
  bar: int;
end

type return is list (operation) * store

function getBar (const r: request; var store: store): return is
    block {
      skip;
    } with (list [Tezos.transaction(store.bar, 0mutez, r.callback)], store);

function main (const action: action; var store: store): return is
  block {
    skip
  } with case action of
    | GetBar(n) -> getBar(n, store)
  end;