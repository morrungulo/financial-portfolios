# financial-portfolios

# Routes

## show

Display the *user* portfolio(s) and watchlist(s)

* show (GET)

## Portfolios

Display the portfolios, assets per portfolio and the transactions per asset.

### Portfolio

A portolio contains a list of assets.

* portfolio/create (GET and POST)
* portfolio/remove (POST)
* portfolio/:pid (GET)

### Asset

An asset can be a *stock*, *crypto* or *cash* and contains a list of transactions.

* portfolio/:pid/asset/create (GET and POST)
* portfolio/:pid/asset/remove (POST)
* portfolio/:pid/asset/:aid (GET)

### Transaction

A Transaction can be of type *buy*, *sell*, *dividend* and *split*.

* portfolio/:pid/asset/:aid/transaction/create (GET and POST)
* portfolio/:pid/asset/:aid/transaction/remove (POST)
* portfolio/:pid/asset/:aid/transaction/:tid (GET)
* portfolio/:pid/asset/:aid/transaction/:tid/update (GET and POST)

## Watchlists

Display the watchlist and its exchange data.

### Watchlist

A watchlist contains a list of exchange data entries.

* watchlist/create (GET and POST)
* watchlist/remove (POST)
* watchlist/:wid (GET)

### Exchange data entry

An Exchange data entry can be a *stock*, *crypto* or *cash*.

* watchlist/:wid/data/create (GET and POST)
* watchlist/:wid/data/remove (POST)
* watchlist/:wid/data/:did (GET)

# Exchange Data

Exchange data must be stored in their own tables.

1. overview
2. intraday
3. daily

These tables are not accessible from the outside.

A data entry is added whenever this stock is referenced in either a watchlist data or a portfolio asset. Data is retrieved from _some site_ and stored.

Data is refreshed every minute only, and must be triggered via a show (portfolios only), portfolio GET, asset GET, watchlist GET and data GET.

For now, data is never deleted.

