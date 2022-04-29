/**
 * @param {String} str 
 * @returns false if str is invalid string number (eg: None, -)
 */
function isValidFormat(str) {
    if (str === undefined) {
        return false;
    }
    else if (typeof (str) === 'string') {
        return undefined === ['None', '-'].find(v => (str === v))
    }
    return typeof (str) === 'number';
}

/**
 * Return '0' iff 'v' is invalid.
 * @param {String} v 
 * @returns {String}
 */
function convertNoneToZero(v) {
    return isValidFormat(v) ? v : '0';
}

/**
 * Remove the percent sign of the number (from '0.1234%' to '0.1234'). If invalid, return '0'.
 * @param {String} v 
 * @returns {String}
 */
function convertStringWithPercentSignToNumber(v) {
    if (isValidFormat(v) && v.endsWith('%')) {
        return v.replace(/%$/g, '');
    }
    return '0';
}

/**
 * Convert a percentage number (e.g. 6.7) to a percentage string (e.g. '6.7')
 * @param {Number} v 
 * @returns {String}
 */
function convertPercentNumberToPercentValue(v) {
    if (isValidFormat(v)) {
        return v.toString();
    }
    return '0';
}

module.exports = {
    convertNoneToZero,
    convertStringWithPercentSignToNumber,
    convertPercentNumberToPercentValue
}