var https = require("https");
var csv = require('csv-parse');

/**
 * Return the object obtained after fetching and parsing the CSV file at 'url'.
 * @param {String} url
 * @returns {Promise} 
 */
const fetchAndParseCsvFile = (url) => {
    return new Promise((resolve, reject) => {
        https.request(url, response => {
            const contents=[];
            const pipe = response.pipe(
                csv({
                    trim: true,
                    columns: true,
                    delimiter: ',',
                    skip_empty_lines: true
                })
            );
            pipe.on('data', row => {
                contents.push(row);
            });
            pipe.on('finish', () => {
                resolve(contents);
            });
        }).end();
    });
}

module.exports = {
    fetchAndParseCsvFile
}