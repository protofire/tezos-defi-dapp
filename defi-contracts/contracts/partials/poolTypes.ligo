type tokenInformation is record
  contractAddress: address;
  tokenDecimals: nat;
  tokenSupply: nat;
end

type balanceInfo is record
  tezAmount: tez;
  blockTimestamp: timestamp;
end

type store is record  
  owner: address;
  deposits: big_map(address, balanceInfo);
  borrows: big_map(address, balanceInfo);
  totalDeposits: tez;
  totalBorrows: tez;
  collateralRate: nat; // The collateral ratio that borrows must maintain (e.g. 2 implies 2:1), this represents the percentage of supplied value that can be actively borrowed at any given time.
  liquidity: tez;
  token: tokenInformation;
end