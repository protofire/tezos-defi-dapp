const BigNumber = require('bignumber.js');
const TezosToolKit = require('@taquito/taquito');
const { Tezos } = TezosToolKit; 

exports.tzFormatter = (amount, format) => {
  const bigNum = new BigNumber(amount);
  if (bigNum.isNaN()) {
    return amount;
  }

  if (format === 'tz') {
    return `${Tezos.format('mutez', 'tz', amount)} ꜩ`;
  } else if (format === 'mtz') {
    return `${Tezos.format('mutez', 'mtz', amount)} mꜩ`;
  } else {
    return bigNum.toString();
  }
}

const tokenAmountInUnitsToBigNumber = (amount, decimals) => {
    const decimalsPerToken = new BigNumber(10).pow(decimals);
    return amount.div(decimalsPerToken);
};

exports.tokenAmountInUnits = (amount, decimals, toFixedDecimals = 2) => {
    return tokenAmountInUnitsToBigNumber(amount, decimals).toFixed(toFixedDecimals);
};

exports.unitsInTokenAmount = (units, decimals) => {
    const decimalsPerToken = new BigNumber(10).pow(decimals);

    return new BigNumber(units).multipliedBy(decimalsPerToken);
};

exports.tokenSymbolToDisplayString = (symbol) => {
    return symbol.toUpperCase();
};

exports.getTokenStorage = async (address, keys) => {
  const contract = await Tezos.contract.at(address);
  const storage = await contract.storage();
  const accounts = await keys.reduce(async (prev, current) => {
    const value = await prev;

    let entry = {
      balance: new BigNumber(0),
      allowances: {},
    };

    try {
      entry = await storage.accounts.get(current);
    } catch (err) {
      // Do nothing
    }

    return {
      ...value,
      [current]: entry
    };
  }, Promise.resolve({}));
  return {
    ...storage,
    accounts
  };
};

exports.getPoolStorage = async (address, keys) => {
  const contract = await Tezos.contract.at(address);
  const storage = await contract.storage();

  const deposits = await keys.reduce(async (prev, current) => {
    const value = await prev;

    let deposit = {
      tezAmount: new BigNumber(0),
      blockTimestamp: null,
    };

    try {
      deposit = await storage.deposits.get(current);
    } catch (err) {
      // Do nothing
    }

    return {
      ...value,
      [current]: deposit
    };
  }, Promise.resolve({}));
  
  const borrows = await keys.reduce(async (prev, current) => {
    const value = await prev;

    let borrow = {
      tezAmount: new BigNumber(0),
      blockTimestamp: null,
    };

    try {
      borrow = await storage.borrows.get(current);
    } catch (err) {
      // Do nothing
    }

    return {
      ...value,
      [current]: borrow
    };
  }, Promise.resolve({}));

  return {
    ...storage,
    deposits,
    borrows,
  };
};