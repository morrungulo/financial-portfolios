/**
 * Return 0 iff 'v' is equal to 'None'.
 * @param {String} v 
 */
function convertNoneToZero(v) {
    return (typeof (v) === 'string' && v == 'None') ? 0 : v;
}

/**
 * Remove the percent sign of the number (from '0.1234%' to '0.1234').
 * @param {String} v 
 */
function convertStringWithPercentSignToNumber(v) {
    if (typeof (v) === 'string') {
        if (v == 'None') return 0;
        if (v.endsWith('%')) return v.replace(/%$/g, '');
        return v;

    }
}

module.exports = {
    convertNoneToZero,
    convertStringWithPercentSignToNumber
}