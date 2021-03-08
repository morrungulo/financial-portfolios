module.exports.prepareCommonDataForUpdate = function(data) {
    const result = {};
    Object.keys(data).forEach(k => result['common.' + k] = data[k]);
    return result;
}