const mongoose = require('mongoose');

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
        // validate: {
        //     : (value) => {
        //         return value < Date.now();
        //     }
        // }
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
    },

    // if buy, cost = price*quantity+commission
    // if sell, cost = price*quantity+commission
    value_cost: {
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
        type: Buffer
    }
}, { timestamps: true });

// the model
const TransactionStock = mongoose.model('transactionstock', transactionStockSchema);


// on create send create transaction event
// listen to transaction event
// 


module.exports = TransactionStock;