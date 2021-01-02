const mongoose = require('mongoose');

// the schema
const transactionCryptoSchema = new mongoose.Schema({
    kind: {
        type: String,
        required: true,
        lowercase: true,
        enum: ['buy', 'sell']
    },
    date: {
        type: Date
    },
    quantity: {
        type: Number,
        min: 0
    },
    price: {
        type: Number,
        min: 0
    },
    commission: {
        type: Number,
        min: 0
    }
});

// there is no model

module.exports = transactionCryptoSchema;