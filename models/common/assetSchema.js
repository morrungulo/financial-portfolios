const mongoose = require('mongoose');

/**
 * The error messages.
 */
const errorMessages = {
    notes: "Length of notes must be less than or equal to 128 characters",
};

/**
 * returns true if asset is in status 'open'
 */
const isOpen = (instance) => {
    return instance.status === 'open';
}

/**
 * returns true if asset is in status 'error'
 */
const isError = (instance) => {
    return instance.status === 'error';
}

/**
 * Common schema to all assets.
 */
const commonSchema = new mongoose.Schema({

    // what is the current status of this asset (calculated on preSaveTrigger)
    // - new - newly created
    // - open - has open position, namely positive stocks
    // - close - does not have open position, zero stocks
    // - error - invalid status (most likely caused by invalid transactions)
    status: {
        type: String,
        lowercase: true,
        default: 'new',
        enum: ['new', 'open', 'close', 'error'],
    },
    
    // total quantity of units
    total_quantity: {
        type: Number,
        default: 0
    },

    // total cost of all units
    total_cost: {
        type: Number,
        default: 0
    },

    // current value of asset (price*total_quantity)
    unrealized_value: {
        type: Number,
        default: 0,
    },

    // percentage of the current value in relation to its cost (unrealized/total_cost)
    unrealized_value_percentage: {
        type: Number,
        default: 0
    },

    // weighted average of the unit price
    average_cost_per_unit: {
        type: Number,
        default: 0,
    },

    // sum(sell transactions + total_dividends)
    realized_value: {
        type: Number,
        default: 0,
    },

    // sum(dividend transactions)
    total_dividends: {
        type: Number,
        default: 0,
    },

    // sum(buy.commission + sell.commission)
    total_commissions: {
        type: Number,
        default: 0,
    },

    // change * total_quantity
    daily_value: {
        type: Number,
        default: 0
    },

    daily_value_percentage: {
        type: Number,
        default: 0
    },

    // tags (categories)
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
    }],

    // total number of transactions
    total_transactions: {
        type: Number,
        min: 0,
        default: 0
    },

    // notes
    notes: {
        type: String,
        maxlength: [128, errorMessages.notes],
    },

}, { minimize: false });

module.exports = {
    commonSchema,
    isOpen,
    isError,
}