# Financial Portfolios

As I started learning Javascript and Node.js, I needed to have a small project to implement all I had learned. It was a tough beginner project, but very satisfying to finally see it come alive.
However as I was developing the project, the feature set just kept growing and growing, until I decided to finish it as it is. Many more features could be added, but I leave that up to you!
Now I am ready to move to the next one.

## Design decisions

One of the major goals for this project was to learn Node.js and Javascript. This goal was reached. There were also secondary goals, namely (1) improve and employ my own CSS implementation and (2) connect and interact with a database engine. This led to two important design decisions:
- I would not use any CSS library such as bootstrap or materialize.
- In the beginning I was using CouchDB but after discussions with a friend, I decided to move to MongoDB.

The deployment of the project on the local machine is via Node.js backend and MongoDB are through `Docker`. More info [here](#launch-with-docker-compose).

## AlphaVantage API

The Stock, Crypto and Forex data are provided by the Alpha Vantage API -- Since I did not purchase any of their plans, this project is optimized to only use their free service -- 5 API requests per minute and 500 API requests per day. In order to use this project you need to get your own free Alpha Vantage API key, but be aware of its limitations. The implementation has `schedulers` to fetch data in order not to violate the restrictions of the free service but it may happen (if for example you add many new stocks at once) that the service is not able to accomodate your requests. You'll just have to try again on the following minute or so!

[Get your free Alpha Vantage API key](https://www.alphavantage.co/support/#api-key).

# Launch with Docker Compose

**You must have your Alpha Vantage API key ready.**

1. Clone the repository

```
$ git clone https://github.com/morrungulo/financial-portfolios.git
```

2. `cd` to its directory

```
$ cd financial-portfolios
```

3. `export` your Alpha Vantage API key (AVAK). You can do this in 2 different ways:

- Set the environment variable in a `.env` file (recommended):

```
$ echo AVAK=XYZ0123456789 > .env
$ cat .env
AVAK=XYZ0123456789
```

- Set the environment variable in your shell:

```
$ export AVAK=XYZ0123456789
```


4. Launch the docker containers

```
$ docker-compose up --build -d
```

5. Check that the containers are running ok

```
$ docker container ls
CONTAINER ID    IMAGE                   COMMAND                   CREATED           STATUS           PORTS                       NAMES
11bb68b1eda0    financial_portfolios    "docker-entrypoint.s…"    44 seconds ago    Up 44 seconds    0.0.0.0:9999->3000/tcp      financial-portfolios_application_1
94114c5e8095    mongo:latest            "docker-entrypoint.s…"    45 seconds ago    Up 44 seconds    0.0.0.0:27017->27017/tcp    financial-portfolios_mongodb_1
```

4. Goto any browser and check the URL `localhost:9999`. Success! You are now ready to use the **Financial Portfolios** application.

### Customize the URL port

You may modify the port number from the default value `9999` to any other value you wish. Just edit the file `docker-compose.yml`, search for `9999` and change to the port number you wish. Save the file before exiting and execute the `docker-compose` command again.

# How to use the application

## Registration

## Create a Portfolio

### Add assets

## Create a Watchlist

### Add assets

An asset can be a *stock*, *crypto* or *cash* and contains a list of transactions.

