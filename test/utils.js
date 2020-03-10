const BigNumber = require('bignumber.js');

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