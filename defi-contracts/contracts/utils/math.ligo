// Naive iterative solution to calculate pow(x, n), would be to multiply x exactly n times
function natPow (var baseNumber : nat; var exponent : nat) : nat is
  block {
    var i: nat := 1n;
    var result: nat := 1n;

    while i <= exponent block {
      result := result * baseNumber;
      i := i + 1n;
    }
  } with result;