
#include "conversions.ligo"

function main(const p: unit; const s: unit): (list(operation) * tez) is
  block {
    const noOperations: list(operation) = nil;

    const anualBlocks: int = 500000;
    const anualInterest: int = 5;

    const elapsedBlocks: int = 20000;
    const deposit: tez = 33000mutez;
    
    const accruedInterest: int = (elapsedBlocks * 100) / anualBlocks;
    const depositAsNat: nat = tezToNatWithMutez(deposit);
    const depositAsInt: int = natToInt(depositAsNat);
    const accruedTezAsInt: int = (accruedInterest * anualInterest * depositAsInt)/10000;
    const newDepositAsInt: int = depositAsInt + accruedTezAsInt;

    const res: tez = natToMutez(abs(newDepositAsInt));

  } with(noOperations, res)
  

  