const expressLoader = require('./express');
const mongooseLoader = require('./mongoose');
const schedulerLoader = require('./scheduler')
module.exports = {
    initialize: async ({ expressApp }) => {
        await Promise.all([
            mongooseLoader.initialize(),
            expressLoader.initialize(expressApp),
            schedulerLoader.initialize(),
        ]);
        console.log('Initialization complete!');
    }
};