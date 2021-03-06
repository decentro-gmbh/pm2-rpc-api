# RPC Automagic

[![](https://img.shields.io/badge/TypeScript-v3-blue.svg?style=flat)](https://github.com/decentro-gmbh/rpc-automagic/blob/master/package.json
) [![](https://img.shields.io/npm/v/rpc-automagic.svg)](https://www.npmjs.com/package/rpc-automagic
) [![](https://img.shields.io/snyk/vulnerabilities/npm/rpc-automagic.svg)](https://snyk.io/test/npm/rpc-automagic
) [![](https://img.shields.io/github/license/decentro-gmbh/rpc-automagic.svg?style=flat)](https://github.com/decentro-gmbh/rpc-automagic/blob/master/LICENSE)

Automagically create HTTP [JSON-RPC 2.0](https://www.jsonrpc.org/specification) endpoints for any node module!

## Why you might want this

* Write only 4 lines of code in order to create an HTTP RPC endpoint for any module!
* Small footprint (5 dependencies, total package size < 20 kB)
* Multiple ways of configuration (environment variables, command line flags), useful when deploying in different environments (e.g., local development, staging, production)
* No client library needed: As JSON-RPC 2.0 is used, it is trivial to create RPC requests by hand and parse responses.

## Installation

Installation is straight forward with npm:
```
npm i rpc-automagic
```

## Examples

As simple as it gets: create a new RPC server, register an endpoint and start listening:
```ts
const { RpcServer } = require('rpc-automagic');

const server = new RpcServer({ host: 'localhost', port: 1337 });
server.addEndpoint('/math', Math);
server.start();
```

Send a POST request to http://localhost:1337/math

```js
--> { "jsonrpc": "2.0", "id": 1, "method": "pow", "params": [2, 10] }
<-- { "jsonrpc": "2.0", "id": 1, "result": 1024}
```

#### Advanced example

In this example, we add two endpoints:
* `/console`: this endpoint exposes the `console` object
* `/custom`: this endpoint exposes a custom module we created

```ts
const { RpcServer } = require('rpc-automagic');

const server = new RpcServer({ host: 'localhost', port: 1337 });
server.addEndpoint('/console', console);
server.addEndpoint('/custom', {
  pick(...items) {
    return `I like this one best: ${items[Math.floor(Math.random() * items.length)]}`;
  },
});
server.start();
```

As `console.log` does not return anything, we send a [notification](https://www.jsonrpc.org/specification#notification) to the server by omitting the `id` member of the request object. This way, the server immediately answers our request but with an empty response object.
```js
// POST localhost:1337/console
--> { "jsonrpc": "2.0", "method": "log", "params": ["Hello World"] }
<-- { "jsonrpc": "2.0", "result": {} }

// POST localhost:1337/custom
--> { "jsonrpc": "2.0", "id": 1, "method": "pick", "params": ["Margherita", "Frutti di Mare", "Quattro Formaggi"] }
<-- { "jsonrpc": "2.0", "id": 1, "result": "I like this one best: Margherita" }
```

## API Documentation

The full API documentation can be found here: https://decentro-gmbh.github.io/rpc-automagic/

## Configuration

The following configuration options are available:

* `host`: Server host (default: 'localhost')
* `port`: Server port (default: 1337)
* `disabled`: Whether the server is disabled by default. Results in the start() method exiting immediately (default: false)
* `authentication`: Enable authentication (default: false)
* `apikeyhash`: Provide the SHA256 hash (in hexadecimal format) of the API key that is used for authentication

There are multiple ways to configure the RPC server during initialization:
1. Provide an options object while creating a new `RpcServer` instance.
2. Provide one or more configuration options as a command line flag (e.g. `--port=1234`, `--disabled`, ...)
3. Provide one or more configuration options as an environment variable. The default prefix is `RPC_SERVER_` but you can customize it using the `envPrefix` option while creating a new `RpcServer` instance. Examples: `RPC_SERVER_PORT=1234`, `RPC_SERVER_DISABLED=true`

The order in which the sources of configuration options are considered is the following:
1. command line flags
2. environment variables
3. options object during initialization

For example, starting a server like this:
```
RPC_SERVER_PORT=1234 ./start-rpc-server --port=4321
```
would result in the server listening on port 4321 as command line flags are considered before environment variables.

## Authentication

You can globally enable authentication for all endpoints of the RPC server by setting `authentication=true` and providing the hash of an API key, e.g.:

```
apikeyhash= '959c9f50aef1bc129a0e16564319a1b36515d570513079b6c73c72a5709abdce', // sha256('secr3t')
```

If authentication is enabled, each request must provide the configured API key using the `Authorization` HTTP header. Example request:

```
POST /math HTTP/1.1
Host: localhost:1337
Authorization: secr3t

{ "jsonrpc": "2.0", "id": 123, "method": "pow", "params": [2, 11] }
```

## Custom RPC Endpoints

Some modules might require special care so that they can be transformed into an RPC endpoint. A common problem is the occurrence of callback parameters, as we cannot pass functions over JSON. However, it is quite simple to extend the `RpcEndpoint` class and override the `execute()` method to solve these kind of issues.
As an example, we want to create an RPC endpoint for the pm2 API, which uses callbacks for each of its functions:

```ts
const bluebird = require('bluebird');
const pm2Sync = require('pm2');
const { RpcEndpoint } = require('rpc-automagic');

// Promisify pm2 to eliminate callbacks
const pm2 = bluebird.promisifyAll(pm2Sync);

class Pm2Endpoint extends RpcEndpoint {
  constructor() {
    super('/pm2', pm2);
  }

  /** Execute pm2 RPCs, use the async pendant of the requested method */
  async execute(method, params) {
    return super.execute(`${method}Async`, params);
  }
}
```

We can now use our custom RpcEndpoint class to create an `/pm2` endpoint:

```ts
const server = new RpcServer();
server.addEndpoint(new Pm2Endpoint());
server.start();
```

## Logging

The default logger simply uses `console.log` and `console.error` for printing log messages:

```ts
logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.log(`[WARNING] ${msg}`),
  err: (msg) => console.error(`[ERROR] ${msg}`),
};
```
 However, a custom logger object can be provided as the `logger` member of the options object while creating a new RPC server. This way, you can also disable all logging:

```ts
logger = {
  info: (msg) => {}),
  warn: (msg) => {}),
  err: (msg) => {}),
};
```

The format of the request logging can be changed with the `requestLoggingFormat` option to any of the available [morgan](https://www.npmjs.com/package/morgan) logging formats ('common', 'dev', 'short', 'tiny', ...).
