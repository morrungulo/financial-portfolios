const mongoose = require('mongoose');

// the schema
const transactionCashSchema = new mongoose.Schema({
    kind: {
        type: String,
        required: true,
        lowercase: true,
        enum: ['buy', 'sell', 'units']
    },

    date: {
        type: Date,
        required: [true, "A date is required"],
    },

    // buy, sell, units
    quantity: {
        type: Number,
        default: 0,
    },

    // buy, sell
    price: {
        type: Number,
        min: 0,
        default: 0,
    },

    // buy, sell, units
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

    // before/after (calculated)
    split_ratio: {
        type: Number,
        default: 1
    },

    // all
    notes: {
        type: Buffer
    },

    // the asset this transaction belongs to
    asset_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'assetCash',
        required: [true, 'An asset is required'],
        index: true,
    }

}, { timestamps: true });

// calculate some fields
transactionCashSchema.pre('save', function (next) {
    if (this.kind === 'buy') {
        this.cost = (this.price * this.quantity) + this.commission;
    }
    else if (this.kind === 'sell') {
        this.cost = this.commission;
        this.realized = (this.price * -this.quantity) - this.commission;
    }
    else if (this.kind === 'units') {
        this.cost = this.commission;
    }
    next();
});

// the model
const TransactionCash = mongoose.model('transactioncash', transactionCashSchema);

module.exports = TransactionCash;