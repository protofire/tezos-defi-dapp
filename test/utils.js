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