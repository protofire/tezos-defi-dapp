type action is AddOwner of (address)

type store is record
  owners: set(address);
end  

type return is list(operation) * store

function isOwner (const addressOwner : address; var store : store) : bool is store.owners contains addressOwner;

function addOwner (const newOwnerAddress : address; var store : store) : return is
  block {
    const newOwners : set(address) = Set.add(newOwnerAddress, store.owners)
  } with ((nil : list (operation)), store with record [owners = newOwners;]);

function main (const action: action; var store: store): return is
  block {
    skip
  } with case action of
    AddOwner(n) -> addOwner(n, store)
  end;