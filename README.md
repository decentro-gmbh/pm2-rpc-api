# RPC Automagic

[![](https://img.shields.io/badge/TypeScript-v3-blue.svg?style=flat)](https://github.com/decentro-gmbh/rpc-automagic/blob/master/package.json
) [![](https://img.shields.io/npm/v/rpc-automagic.svg)](https://www.npmjs.com/package/rpc-automagic
) [![](https://img.shields.io/snyk/vulnerabilities/npm/rpc-automagic.svg)](https://snyk.io/test/npm/rpc-automagic
) [![](https://img.shields.io/github/license/decentro-gmbh/rpc-automagic.svg?style=flat)](https://github.com/decentro-gmbh/rpc-automagic/blob/master/LICENSE)

Automagically create HTTP [JSON-RPC 2.0](https://www.jsonrpc.org/specification) endpoints for any node module!

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
* `/custom`: this endpoint exposes a custom object we created

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

The API documentation can be found here: https://decentro-gmbh.github.io/rpc-automagic/
