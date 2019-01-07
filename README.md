# RPC Automagic

[![](https://img.shields.io/badge/TypeScript-v3-blue.svg?style=flat)](https://github.com/decentro-gmbh/rpc-automagic/blob/master/package.json
) [![](https://img.shields.io/npm/v/rpc-automagic.svg)](https://www.npmjs.com/package/rpc-automagic
) [![](https://img.shields.io/snyk/vulnerabilities/npm/rpc-automagic.svg)](https://www.npmjs.com/package/rpc-automagic
) [![](https://img.shields.io/github/license/decentro-gmbh/rpc-automagic.svg?style=flat)](https://github.com/decentro-gmbh/rpc-automagic/blob/master/LICENSE)

Automagically create HTTP [JSON-RPC 2.0](https://www.jsonrpc.org/specification) endpoints for any node module!

## Installation

Installation is straight forward with npm:
```
npm i rpc-automagic
```

## Installation

Installation is straight forward with npm:
```
npm i rpc-automagic
```

## Example

1. Create a simple RPC server allowing the execution of shell commands using the `execa` module:
```ts
const execa = require('execa');
const { RpcServer } = require('rpc-automagic');

const server = new RpcServer();
server.addEndpoint('/execa', execa);
server.start();
```

2. Send a POST request to http://localhost:1337/execa
```
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "shell",
  "params": [
    "whoami"
  ]
}
```

3. Parse the response object:
```
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "stdout": "root",
    "stderr": "",
    "code": 0,
    "failed": false,
    "killed": false,
    "signal": null,
    "cmd": "/bin/sh -c whoami",
    "timedOut": false
  }
}
```

## API Documentation

The API documentation can be found here: https://decentro-gmbh.github.io/rpc-automagic/
