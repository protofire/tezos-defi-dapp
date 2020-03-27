// Naive iterative solution to calculate pow(x, n), would be to multiply x exactly n times
function pow (var baseNumber : int; var exponent : int) : int is
  block {
    var result: int := 1;

    while exponent =/= 0 block {
      result := result * baseNumber;
      exponent := exponent - 1;
    }
  } with result;