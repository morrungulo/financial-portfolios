# financial-portfolios

# Routes

## show

Display the *user* portfolio(s) and watchlist(s)

* ~~show (GET)~~

## Portfolios

Display the portfolios, assets per portfolio and the transactions per asset.

### Portfolio

A portolio contains a list of assets.

* ~~portfolios/create (GET and POST)~~
* portfolios/remove (POST)
* *portfolios/:pid (GET)*

### Asset

An asset can be a *stock*, *crypto* or *cash* and contains a list of transactions.

* *portfolios/:pid/asset/create (GET and POST)*
* portfolios/:pid/asset/remove (POST)
* portfolios/:pid/asset/:aid (GET)

### Transaction

A Transaction can be of type *buy*, *sell*, *dividend* and *split*.

* portfolios/:pid/asset/:aid/transaction/create (GET and POST)
* portfolios/:pid/asset/:aid/transaction/remove (POST)
* portfolios/:pid/asset/:aid/transaction/:tid (GET)
* portfolios/:pid/asset/:aid/transaction/:tid/update (GET and POST)

## Watchlists

Display the watchlist and its exchange data.

### Watchlist

A watchlist contains a list of exchange data entries.

* watchlists/create (GET and POST)
* watchlists/remove (POST)
* watchlists/:wid (GET)

### Exchange data entry

An Exchange data entry can be a *stock*, *crypto* or *cash*.

* watchlists/:wid/entry/create (GET and POST)
* watchlists/:wid/entry/remove (POST)
* watchlists/:wid/entry/:eid (GET)

# Exchange Data

Exchange data must be stored in their own tables.

1. overview
2. intraday
3. daily

These tables are not accessible from the outside.

A data entry is added whenever this stock is referenced in either a watchlist data or a portfolio asset. Data is retrieved from _some site_ and stored.

Data is refreshed every minute only, and must be triggered via a show (portfolios only), portfolio GET, asset GET, watchlist GET and data GET.

For now, data is never deleted.

# Currency Exchange Rate

This must also be supported.

