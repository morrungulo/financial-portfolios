const mongoose = require('mongoose');

// the schema
const transactionCashSchema = new mongoose.Schema({
    kind: {
        type: String,
        required: true,
        lowercase: true,
        enum: ['deposit', 'withdraw', 'interest']
    },
    date: {
        type: Date
    },
    quantity: {
        type: Number,
        min: 0
    },
    commission: {
        type: Number,
        min: 0
    },
    notes: {
        type: Buffer
    }
});

// there is no model

module.exports = transactionCashSchema;