const mongoose = require('mongoose');
const mongooseLifecycle = require('mongoose-lifecycle');

// the schema
const transactionStockSchema = new mongoose.Schema({
    kind: {
        type: String,
        required: true,
        lowercase: true,
        enum: ['buy', 'sell', 'dividend', 'split']
    },
    
    date: {
        type: Date,
        required: [true, "A Transaction Date is required"]
    },

    /* buy and sell */
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
    },

    /* dividend only */
    dividend: {
        type: Number,
        min: 0
    },

    /* split only */
    split_before: {
        type: Number,
        min: 1
    },
    split_after: {
        type: Number,
        min: 1
    },

    /* notes */
    notes: {
        type: String
    },

    // calculated
    // if buy, cost = price*quantity+commission
    // if sell, cost = price*quantity+commission
    value_cost: {
        type: Number,
        min: 0
    },

}, { timestamps: true });

// register listener
transactionStockSchema.plugin(mongooseLifecycle);

// the model
const TransactionStock = mongoose.model('transactionstock', transactionStockSchema);

// listeners
TransactionStock.on('beforeSave', (entry) => {
    entry.value_cost = (entry.price * entry.quantity) + entry.commission;
});

module.exports = TransactionStock;