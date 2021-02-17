const { Parser } = require('json2csv');
const dateformat = require('dateformat');

/**
 * Sends the 'data' object filtered with the information in the 'fields' object as a 'csv'
 * file named 'fileName' as a response attachment. 
 * @param {HTTPResponse} res 
 * @param {String} fileName 
 * @param {Object} fields 
 * @param {Object} data 
 */
const downloadResource = (res, fileName, fields, data) => {
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(data);
    res.header('Content-Type', 'text/csv');
    res.header("Content-Disposition", 'attachment; filename=' + fileName);
    res.attachment(fileName);
    return res.send(csv);
}

/**
 * Returns a String with the proposed filename. It appends the date down to the second to the filename.
 * If the parameters are 'text' and 'alice' respectively, the return name will be 'text-alice-20210102-175534.csv'.

 * @param {String} filetype 
 * @param {String} name 
 */
const getFileName = (filetype, name) => {
    const date = dateformat(Date.now(), "yyyymmdd-HHMMss");
    const fileName = [filetype.trim(), name.trim(), date].join('-').toLowerCase();
    return fileName + '.csv';
}

module.exports = {
    getFileName,
    downloadResource,
}