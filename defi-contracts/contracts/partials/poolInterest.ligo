#include "../utils/conversions.ligo"
#include "../utils/math.ligo"
#include "./poolTypes.ligo"

function getExchangeRate(var store: store): nat is 
  block {
    var realTokenSupply :nat := 1n;
    if store.token.tokenSupply > 0n
      then realTokenSupply :=  store.token.tokenSupply / natPow(10n, store.token.tokenDecimals);
      else skip;
    var exchangeRate :nat := tezToNat(store.totalDeposits + store.totalBorrows) / realTokenSupply;
  } with exchangeRate; attributes ["inline"];

function getCoefficientInterest(var store: store): nat is 
  block {
    var coefficientInterest :nat := 1n;
    if (store.totalDeposits + store.totalBorrows) > 0tez
      then coefficientInterest := store.totalBorrows / (store.totalDeposits + store.totalBorrows);
      else skip;
  } with coefficientInterest; attributes ["inline"];

function getBorrowInterestRate(var store: store): nat is (2n + getCoefficientInterest(store) * 20n);

function getDepositInterestRate(var store: store): nat is (getBorrowInterestRate(store) * getCoefficientInterest(store));

function calculateBorrowInterest(const accountInfo: balanceInfo; var store: store): tez is 
  block {
    const interest :tez = 0tez;
    case (is_nat(now - accountInfo.blockTimestamp)) of
      | Some (elapsedBlocks) -> block {
          const hourlyBlocks: nat = 3600n; // Seconds x hour
          if elapsedBlocks > hourlyBlocks 
            then block {
              const elapsedHours :nat = elapsedBlocks / hourlyBlocks; 
              const interestRatePercentage :nat = getBorrowInterestRate(store) / 100n;
              const amountInNat :nat = tezToNat(accountInfo.tezAmount);
              case is_nat(amountInNat * natPow(1n + interestRatePercentage / (365n * 24n), 365n * elapsedHours) - amountInNat) of
                | Some(interestInNat) -> interest := natToTz(interestInNat)
                | None -> failwith ("Can get interest")
              end;
            }
            else skip;
        }
      | None -> failwith ("Can't get elapsed blocks")
    end;
  } with interest;

function calculateDepositInterest(const accountInfo: balanceInfo; var store: store): tez is 
  block {
    const interest :tez = 0tez;
    case (is_nat(now - accountInfo.blockTimestamp)) of
      | Some (elapsedBlocks) -> block {
          const hourlyBlocks: nat = 3600n; // Seconds x hour
          if elapsedBlocks > hourlyBlocks 
            then block {
              const elapsedHours :nat = elapsedBlocks / hourlyBlocks; 
              const interestRatePercentage :nat = getDepositInterestRate(store) / 100n;
              const amountInNat :nat = tezToNat(accountInfo.tezAmount);
              case is_nat(amountInNat * natPow(1n + interestRatePercentage / (365n * 24n), 365n * elapsedHours) - amountInNat) of
                | Some(interestInNat) -> interest := natToTz(interestInNat)
                | None -> failwith ("Can't get interest")
              end;
            }
            else skip;
        }
      | None -> failwith ("Can get elapsed blocks")
    end;
  } with interest;