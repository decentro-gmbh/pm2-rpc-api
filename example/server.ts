/**
 * Example server
 */

import { RpcServer } from '../src/rpc-server';

const server = new RpcServer({
  host: '0.0.0.0',
  envPrefix: 'API_',
  authentication: true,
  apikeyhash: '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b',
});

server.start();
