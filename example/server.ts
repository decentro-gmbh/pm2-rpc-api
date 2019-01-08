import { RpcServer } from '../src/rpc-server';

/** Example RPC server */
const server = new RpcServer({
  host: '0.0.0.0',
  envPrefix: 'SERVER_',
  authentication: true,
  requestLoggingFormat: 'dev',
  apikeyhash: '959c9f50aef1bc129a0e16564319a1b36515d570513079b6c73c72a5709abdce', // sha256('secr3t')
});

server.addEndpoint('/console', console);
server.addEndpoint('/math', Math);
server.addEndpoint('/custom', {
  pick(...items) {
    return `I like this one best: ${items[Math.floor(Math.random() * items.length)]}`;
  },
});
server.start();
