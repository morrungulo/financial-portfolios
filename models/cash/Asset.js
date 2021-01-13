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
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'transactioncash',
    }],

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

    // tags (categories)
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
    }],

    // notes
    notes: {
        type: Buffer
    },
    
    // portfolio data
    portfolio_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'portfolio',
        required: true
    },

    // exchange data
    exchange_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'exchangeforex',
        required: true
    }
});

// the model
const AssetCash = mongoose.model('assetcash', assetCashSchema);

module.exports = AssetCash;