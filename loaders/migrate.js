const AssetStock = require("../models/stock/Asset")

module.exports = {
    initialize: async () => {

        // console.log('No migration required!');
        // return;

        // update_many :)
        // await AssetStock.updateMany(
        //     {common: { $exists: true }},
        //     {$unset: {
        //         return_on_investment_percentage: 1,
        //     }},
        //     {strict: false}
        // );
      
        // const results = await AssetStock.find({common: { $exists: true }})
        // results.forEach(result => {
        //     console.log(result.total_quantity);
        //     result.common = {
        //         total_quantity: result.total_quantity,
        //         total_cost: result.total_cost,
        //         unrealized_value: result.unrealized_value,
        //         unrealized_value_percentage: result.unrealized_value_percentage,
        //         average_cost_per_unit: result.avg_cost_per_share,
        //         realized_value: result.realized_value,
        //         total_dividends: result.total_dividends,
        //         total_commissions: result.total_commissions,
        //         daily_value: result.daily_value,
        //         daily_value_percentage: result.daily_value_percentage,
        //         total_transactions: result.total_transactions,
        //         tags: result.tags,
        //         notes: result.notes,
        //     };
        //     console.log(result.common);
        //     result.save().then(function() {
        //         console.log('migrated successfully');
        //     });
        // });
    }
}