
#include "./conversions.ligo"

const emptyOps: list(operation) = list end;

type store is record  
  interest: tez;   
end

type return is list(operation) * store

function main(const action: unit; const store: store): return is
  block {
    const anualBlocks: int = 500000;
    const anualInterest: int = 5;

    const elapsedBlocks: int = 20000;
    const deposit: tez = 33000mutez;
    
    const accruedInterest: int = (elapsedBlocks * 100) / anualBlocks;
    const depositAsNat: nat = tezToNatWithMutez(deposit);
    const depositAsInt: int = natToInt(depositAsNat);
    const accruedTezAsInt: int = (accruedInterest * anualInterest * depositAsInt)/10000;
    const newDepositAsInt: int = depositAsInt + accruedTezAsInt;

    store.interest := natToMutez(abs(newDepositAsInt));

  } with(emptyOps, store)
  

  