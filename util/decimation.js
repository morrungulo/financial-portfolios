const downsampler = require('downsample-lttb');

const maxDataPoints = 150;
const dataPoints = {
    weekdayOnly: {
        W1: 5,
        M1: Math.ceil(30 * 5 / 7),
        M3: Math.ceil(91 * 5 / 7),
        M6: Math.ceil(182 * 5 / 7),
        Y1: Math.ceil(365 * 5 / 7),
        Y5: Math.ceil(365 * 5 * 5 / 7),
    },
    completeWeek: {
        W1: 5,
        M1: 30,
        M3: 91,
        M6: 182,
        Y1: 365,
        Y5: 365 * 5,
    }
};

/**
 * Apply the decimation algorithm to the time series.
 * 
 * @param {Object} timeSeries 
 * @param {Number} numberOfPoints 
 * @returns an Object with the decimation of the original time series
 */
const applyDecimation = (timeSeries, weekdayOnly = true) => {
    const modData = timeSeries.map((ts, index) => { return [index, ts.y]; });
    const result = {};
    Object.keys(dataPoints.weekdayOnly).forEach(key => {
        const numberOfDataPoints = (weekdayOnly) ? dataPoints.weekdayOnly[key] : dataPoints.completeWeek[key];
        const originalData = modData.slice(0, numberOfDataPoints);
        const decimatedData = downsampler.processData(originalData, maxDataPoints);
        result[key] = decimatedData.map(dd => { return timeSeries[dd[0]]; });
    });
    return result;
}

module.exports = {
    applyDecimation
}