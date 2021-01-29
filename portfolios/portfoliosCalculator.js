const chalk = require('chalk');
const { calculateAssetStockFromExchangeData } = require('../assets/assetsStocksCalculator');
const Portfolio = require('../models/Portfolio');
const AssetStock = require('../models/stock/Asset');
const PortfolioEmitter = require('../events/portfolioEmitter');

function isSame(left, right) {
    return left === right;
}

function buildObject(asset) {
    return JSON.stringify(asset);
}

/**
 * @param {ObjectId} portfolio_id 
 * @returns an array with the AssetStock aggregate
 */
const assetStockAggregator = async (portfolio_id) => {
    const data = await AssetStock.aggregate([
        {
            $match: { portfolio_id },
        },
        {
            $group: {
                _id: '$portfolio_id',
                unrealized_value: { $sum: '$unrealized_value' },
                realized_value: { $sum: '$realized_value' },
                total_cost: { $sum: '$total_cost' },
                daily_value: { $sum: '$daily_value' },
                total_transactions: { $sum: '$total_transactions' },
            },
        },
        {
            $project: {
                _id: false,
                unrealized_value: true,
                realized_value: true,
                total_cost: true,
                daily_value: true,
                total_transactions: true,
            },
        },
    ]);
    console.log(chalk.cyan('Portfolio: ' + JSON.stringify(data)));

    let [pdata] = data;
    if (pdata === undefined) {
        pdata = {
            unrealized_value: 0,
            realized_value: 0,
            total_cost: 0,
            daily_value: 0,
            total_transactions: 0,
        };
    }
    return pdata;
}

const updatePercentageValues = (portfolio) => {
    portfolio.total_value = portfolio.unrealized_value + portfolio.realized_value - portfolio.total_cost;
    portfolio.daily_value_percentage = (portfolio.unrealized_value != 0) ? (1 - ((portfolio.unrealized_value - portfolio.daily_value) / portfolio.unrealized_value)) * 100 : 0;
    portfolio.unrealized_value_percentage = (portfolio.total_cost != 0) ? ((portfolio.unrealized_value + portfolio.realized_value) / portfolio.total_cost) * 100 : 0;
}

const updateFieldsDependentOnExchangeData = async (portfolio) => {
    // get current values
    const oldval = buildObject(portfolio);

    const pdata = await assetStockAggregator(portfolio._id);
    Object.assign(portfolio, pdata);

    // calculate new values
    updatePercentageValues(portfolio);

    // check if values have changed
    const newval = buildObject(portfolio);
    return !isSame(oldval, newval);

}

const calculatePortfolioFromExchangeData = async (portfolio_id) => {
    const portfolio = await Portfolio.findById(portfolio_id);

    // update all assets
    portfolio.stock_assets.forEach(async (asset_id) => {
        await calculateAssetStockFromExchangeData(asset_id.toString());
    });

    // update itself
    if (await updateFieldsDependentOnExchangeData(portfolio)) {
        await portfolio.save();
        PortfolioEmitter.emit('update_due_to_exchange', portfolio_id);
    }
}

module.exports = {
    calculatePortfolioFromExchangeData,
}