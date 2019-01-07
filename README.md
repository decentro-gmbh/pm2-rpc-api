# Automagic RPC-API Generation

Automagically create HTTP JSON-RPC 2.0 endpoints for any node module!

## Example

```ts
import * as execa from 'execa';
import { RpcServer } from 'rpc-automagic';

const server = new RpcServer();

server.addEndpoint({
  '/execa': execa,
})

server.start();
```