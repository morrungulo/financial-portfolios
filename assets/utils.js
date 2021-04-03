const constants = require('../constants');

module.exports.prepareCommonDataForUpdate = (data) => {
    const result = {};
    Object.keys(data).forEach(k => result['common.' + k] = data[k]);
    return result;
}

/**
 * Define the state of the asset based on the information from the transaction.
 * @param {Object} tdata 
 * @returns the transaction data with the calculated new state.
 */
module.exports.calculateNewStateFromTransactionData = (tdata) => {
    const hasErrors = (tdata.total_quantity < 0);
    if (hasErrors) return { ...tdata, status: constants.ASSET_STATUS.ERR };

    const hasZeroTransactions = (tdata.total_transactions === 0);
    if (hasZeroTransactions) return { ...tdata, status: constants.ASSET_STATUS.NEW };

    const hasQuantity = (tdata.total_quantity > 0);
    if (hasQuantity) return { ...tdata, status: constants.ASSET_STATUS.OPEN };

    // last case
    return { ...tdata, status: constants.ASSET_STATUS.CLOSE };
}