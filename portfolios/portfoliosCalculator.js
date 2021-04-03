const chalk = require('chalk');
const { calculateAssetStockFromExchangeData } = require('../assets/assetsStocksCalculator');
const { calculateAssetCryptoFromExchangeData, calculateAssetCashFromExchangeData } = require('../assets/assetsCurrenciesCalculator');
const Portfolio = require('../models/Portfolio');
const AssetStock = require('../models/stock/Asset');
const AssetCrypto = require('../models/crypto/Asset');
const AssetCash = require('../models/cash/Asset');
const PortfolioEmitter = require('../events/portfolioEmitter');

/**
 * @param {mongoose model} model 
 * @param {ObjectId} portfolio_id
 * @returns JSON object with the asset aggregated values
 */
const assetAggregator = async (assetModel, portfolio_id) => {
    const data = await assetModel.aggregate([
        {
            $match: { portfolio_id },
        },
        {
            $group: {
                _id: '$portfolio_id',
                unrealized_value: { $sum: '$common.unrealized_value' },
                realized_value: { $sum: '$common.realized_value' },
                total_cost: { $sum: '$common.total_cost' },
                daily_value: { $sum: '$common.daily_value' },
                total_transactions: { $sum: '$common.total_transactions' },
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
    const assetAggregatorActions = [AssetStock, AssetCrypto, AssetCash].map(assetModel => assetAggregator(assetModel, portfolio._id));
    const [stockData, cryptoData, cashData] = await Promise.all(assetAggregatorActions);

    // add to portfolio data
    const pdata = {};
    Object.keys(stockData).forEach(key => {
        pdata[key] = [stockData, cryptoData, cashData].map(data => data[key]).reduce((acc, cur) => { return acc + cur; }, 0);
    });
    Object.assign(portfolio, pdata);

    // add specific subtotals
    portfolio.stock_unrealized_value = stockData.unrealized_value;
    portfolio.crypto_unrealized_value = cryptoData.unrealized_value;
    portfolio.cash_unrealized_value = cashData.unrealized_value;

    // update percentages
    updatePercentageValues(portfolio);
}

const calculatePortfolioFromExchangeData = async (portfolio_id) => {
    const portfolio = await Portfolio.findById(portfolio_id);

    // build and run promises
    const stockActions = portfolio.stock_assets.map(asset_id => calculateAssetStockFromExchangeData(asset_id.toString()));
    const cryptoActions = portfolio.crypto_assets.map(asset_id => calculateAssetCryptoFromExchangeData(asset_id.toString()));
    const cashActions = portfolio.cash_assets.map(asset_id => calculateAssetCashFromExchangeData(asset_id.toString()));
    const allActions = [...stockActions, ...cryptoActions, ...cashActions];
    await Promise.all(allActions);

    // update portfolio
    if (allActions.length > 0) {
        await updateFieldsDependentOnExchangeData(portfolio);
        await portfolio.save();
        PortfolioEmitter.emit('update_due_to_exchange', portfolio_id);
    }
}

module.exports = {
    calculatePortfolioFromExchangeData,
}