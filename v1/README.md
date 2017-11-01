# Node Url Shortener

> URL shortener using [Node.js](http://nodejs.org) and [Redis](http://redis.io).

## Using

* [Express 4](http://expressjs.com/)
* [Redis](http://redis.io)

## Quick Start

```bash
$ git clone https://gitlab.com/sellnews/url_shortner.git
$ cd url_shortner
$ npm install
$ node app
```

## Command Line Options

```bash
$ node app -h

Usage: app [options]

Options:
  -u, --url     Application URL               [default: "http://127.0.0.1:3000"]
  -p, --port    Port number for the Express application          [default: 3000]
  --redis-host  Redis Server hostname                     [default: "localhost"]
  --redis-port  Redis Server port number                         [default: 6379]
  --redis-pass  Redis Server password                           [default: false]
  --redis-db    Redis DB index                                      [default: 0]
  -h, --help    Show help                                              [boolean]
```

## Installation on production

```bash
$ git clone https://github.com/dotzero/node-url-shortener nus
$ cd nus
$ npm install --production
$ NODE_ENV=production node app --url "http://example.com"
```
if PM2 then use following command 
```bash
$ NODE_ENV=production pm2 start app.js -- -u "http://example.io"
```

# RESTful API

`POST /api/v1/shorten` with raw json data `long_url=http://google.com`

```json
{
  "hash": "rnRu",
  "long_url": "http://google.com",
  "short_url": "http://127.0.0.1:3000/rnRu",
  "status_code": 200,
  "status_txt": "OK"
}
```

`GET /api/v1/expand/:hash` with query `rnRu`

```json
{
  "clicks": "1",
  "hash": "rnRu",
  "long_url": "http://google.com",
  "status_code": 200,
  "status_txt": "OK"
}
```

## Tests

To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```
