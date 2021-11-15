/**
 * @param {String} str 
 * @returns true if str is invalid string number (eg: None, -)
 */
function isInvalidFormat(str) {
    if (typeof (str) === 'string') {
        const invalidNumbers = ['None', '-']
        return undefined !== invalidNumbers.find(v => (str == v))
    }
    return true
}

/**
 * Return '0' iff 'v' is invalid.
 * @param {String} v 
 * @returns {String}
 */
function convertNoneToZero(v) {
    return isInvalidFormat(v) ? '0' : v;
}

/**
 * Remove the percent sign of the number (from '0.1234%' to '0.1234'). If invalid, return '0'.
 * @param {String} v 
 * @returns {String}
 */
function convertStringWithPercentSignToNumber(v) {
    if (!isInvalidFormat(v)) {
        if (v.endsWith('%')) return v.replace(/%$/g, '');
    }
    return '0';
}

module.exports = {
    convertNoneToZero,
    convertStringWithPercentSignToNumber
}