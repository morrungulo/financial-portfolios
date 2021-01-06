const mongoose = require('mongoose');
const transactionCashSchema = require('./Transaction');

// the schema
const assetCashSchema = new mongoose.Schema({  
    kind: {
        type: String,
        default: 'Cash',
        immutable: true
    },
    
    currency : {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, "Please enter a currency"]
    },

    // deposits, withdrawls, etc.
    transactions: [transactionCashSchema],

    // commissions on deposits, withdrawls, etc.
    total_commissions: {
        type: Number,
        min: 0,
        default: 0,
    },

    // interest on having the cash
    total_interest: {
        type: Number,
        min: 0,
        default: 0
    },

    // exchange data
    exchange_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExchangeForex',
        required: true
    }
});

// there is no model

module.exports = assetCashSchema;