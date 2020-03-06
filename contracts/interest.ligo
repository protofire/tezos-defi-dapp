
#include "./conversions.ligo"

const emptyOps: list(operation) = list end;

type store is record  
  interest: tez;   
  owner: address;
end

type return is list(operation) * store

// TODO add this as a function of full-pool
function main(const action: unit; const store: store): return is
  block {
    // TODO: check anual blocks from tezos
    const anualBlocks: int = 500000;
    // TODO: add an entry point, with some security(owner), start with 2 percent
    const anualInterest: int = 5;

    // TODO: diferencia entre el deposito y el withdraw
    const elapsedBlocks: int = 20000;

    // TODO: cantidad depositada, esto deberia estar ya en el store
    const deposit: tez = 33000mutez;
    
    const accruedInterest: int = (elapsedBlocks * 100) / anualBlocks;
    const depositAsNat: nat = tezToNatWithMutez(deposit);
    const depositAsInt: int = natToInt(depositAsNat);
    const accruedTezAsInt: int = (accruedInterest * anualInterest * depositAsInt)/10000;
    const newDepositAsInt: int = depositAsInt + accruedTezAsInt;

    store.interest := natToMutez(abs(newDepositAsInt));

  } with(emptyOps, store)
  

  