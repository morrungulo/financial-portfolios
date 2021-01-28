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
        required: [true, "A date is required"],
    },

    // buy and sell
    quantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        min: 0,
        default: 0,
    },
    commission: {
        type: Number,
        min: 0,
        default: 0,
    },

    // cost, realized (calculated)
    cost: {
        type: Number,
        min: 0,
        default: 0,
    },
    realized: {
        type: Number,
        min: 0,
        default: 0,
    },

    // dividend only
    dividend: {
        type: Number,
        min: 0,
        default: 0,
    },

    // split only
    split_before: {
        type: Number,
        min: 1,
        default: 1,
    },
    split_after: {
        type: Number,
        min: 1,
        default: 1,
    },

    // before/after (calculated)
    split_ratio: {
        type: Number,
        default: 1
    },

    // notes
    notes: {
        type: String
    },

    // the asset this transaction belongs to
    asset_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'assetstock',
        required: [true, 'An asset is required']
    }

}, { timestamps: true });

// calculate some fields
transactionStockSchema.pre('save', function(next) {
    if (this.kind == 'buy') {
        this.cost = (this.price * this.quantity) + this.commission;
    }
    else if (this.kind == 'sell') {
        this.cost = this.commission;
        this.realized = (this.price * -this.quantity) - this.commission;
    }
    else if (this.kind == 'split') {
        this.split_ratio = (this.split_before / this.split_after);
    }
    next();
});

// the model
const TransactionStock = mongoose.model('transactionstock', transactionStockSchema);

module.exports = TransactionStock;