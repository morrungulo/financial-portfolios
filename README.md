# Financial Portfolios

As I started learning Javascript and Node.js, I needed a small project to apply what I had learned. It was a tough beginner project, but very satisfying to finally see it come alive. It only took 3 months!
However as I was developing the project, the feature set just kept growing and growing, until I decided to finish it with the existing feature set. Many more features could be added, but I leave that up to you!
Now I am ready to move to the next one.

## Design decisions

One of the major goals for this project was to learn Node.js and Javascript. This goal was achieved. There were also secondary goals, namely (1) improve and employ my own CSS implementation and (2) connect and interact with a database engine. This led to two important design decisions:
- I would not use any CSS library such as bootstrap or materialize, I would write my own CSS (gosh).
- In the beginning I was using CouchDB but after discussions with a friend, I changed to MongoDB.

The deployment of the application on the local machine is via `Docker`. The Node.js backend and MongoDB run in two independent `Docker` containers and launched with `docker-compose`. More info [here](#launch-with-docker-compose).

## AlphaVantage API

The Stock, Crypto and Forex data are provided by the [Alpha Vantage API](https://www.alphavantage.co/) -- Since I did not purchase any of their plans, this project is optimized to only use their free service, restricted to 5 API requests per minute and 500 API requests per day. In order to use this application you must get your own free Alpha Vantage API key, but be aware of its limitations. The implementation has `schedulers` to fetch data in order not to violate the restrictions of the free service but it may happen (if for example you add many new stocks at once) that the service is not able to accomodate your requests. You'll just have to try again on the next minute or so!

[Get your free Alpha Vantage API key](https://www.alphavantage.co/support/#api-key).

# Launch with Docker Compose

**You must have your Alpha Vantage API key ready.**

#### Clone the repository

```
$ git clone https://github.com/morrungulo/financial-portfolios.git
```

#### `cd` to its directory

```
$ cd financial-portfolios
```

#### `export` your Alpha Vantage API key (AVAK)

##### Either set the environment variable in a `.env` file (recommended):

```
$ echo AVAK=XYZ0123456789 > .env
$ cat .env
AVAK=XYZ0123456789
```

##### Or set the environment variable in your shell:

```
$ export AVAK=XYZ0123456789
```


#### Launch the docker containers

```
$ docker-compose up --build -d
```

#### Check that the containers are running ok

```
$ docker container ls
CONTAINER ID    IMAGE                   COMMAND                   CREATED           STATUS           PORTS                       NAMES
11bb68b1eda0    financial_portfolios    "docker-entrypoint.s…"    44 seconds ago    Up 44 seconds    0.0.0.0:9999->3000/tcp      financial-portfolios_application_1
94114c5e8095    mongo:latest            "docker-entrypoint.s…"    45 seconds ago    Up 44 seconds    0.0.0.0:27017->27017/tcp    financial-portfolios_mongodb_1
```

#### Goto any browser and check the URL `localhost:9999`

Success! You are now ready to use the **Financial Portfolios** application.

## Customize the URL port

You may modify the port number from the default value `9999` to any other number you wish. Just edit the file `docker-compose.yml`, search for `9999` and change to the port number you wish. Save the file before exiting and execute the `docker-compose` command again.

# How to use the application

## Registration

Upon navigating to the main page, click on the upper-right yellow button `REGISTER`. Enter your email (it can be any email) and your password. You will then be forwarded to the `user home` page.

The `user home` page is your main page. It displays your portfolios on the left panel and your watchlists on the right panel.

## Add a Portfolio

On the `user home` page, click on the `ADD PORTFOLIO`. Choose a name and a currency (only 4 supported - sorry).

I suggest to name your portfolios with the name of the institution that holds your assets. For example, if you want to track your crypto assets in Binance, then name your portfolio `Binance`.

In order to re-calculate your portfolio value (based on your assets and asset current prices) you'll have to manually click on the `refresh` icon (![refresh](https://github.com/morrungulo/financial-portfolios/blob/main/public/img/iconmonstr-synchronization-18.svg "Refresh").

### Add assets

To add assets to any portfolio, click on the portfolio name and then on the `ADD ASSET` button. Select the asset type (stock, crypto or cash) and correspondent field:

* Stock - select the ticker (e.g. MSFT) for the stock you wish to add (no autocomplete - sorry).
* Crypto - select the crypto code (e.g. BTC) for the crypto you wish to add (no autocomplete - sorry).
* Cash - select the 3-letter code (e.g. EUR) for the currency you wish to add (no autocomplete - sorry).

### Add transactions

To add a transaction on a particular asset, click on the asset and then on the `ADD TRANSACTION` button. Select the transaction type and fill out the remaining fields accordingly.

Upon entering transaction data, it will be shown several metrics (unrealized value, costs, realized value, dividends, etc.) for that asset. These metrics are calculated based on the quantity of *units* for the asset and its current price. You'll have to manually click on the `refresh` icon (![refresh](https://github.com/morrungulo/financial-portfolios/blob/main/public/img/iconmonstr-synchronization-18.svg "Refresh") to re-calculate with the current price.

## Add a Watchlist

On the `user home` page, click on the `ADD WATCHLIST`. Choose a name.

### Add entries

To add entries to any watchlist, click on the watchlist name and then on the `ADD ENTRY` button. Select the asset type (stock, crypto or cash) and correspondent field(s):

* Stock - select the ticker (e.g. MSFT) for the stock you wish to add (no autocomplete - sorry).
* Crypto - select the `from` crypto code (e.g. BTC) and the `to` 3-letter currency code (e.g. EUR) for the crypto you wish to add (no autocomplete - sorry).
* Cash - select the `from` 3-letter code (e.g. USD) and the `to` 3-letter currency code (e.g. EUR) for the currency you wish to add (no autocomplete - sorry).

A new entry will be added to the watchlist table. You may sort the table entries by clicking on the respective header (sorting order will not be saved - sorry). If you want to know more details about the entry, you may click on the name to be taken to another page where it will be displayed 3 panels with the price history, the entry profile and the entry summary.

# Additional Features

If you would like me to implement additional features (or correct any nasty bug), feel free to contact me with the request.
