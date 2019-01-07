/**
 * Example server
 */

import * as execa from 'execa';
import * as child_process from 'child_process';
import { RpcServer } from '../src/rpc-server';
import { Pm2Endpoint } from './pm2';

const server = new RpcServer({
  host: '0.0.0.0',
  authentication: true,
  envPrefix: 'SERVER_',
  apikeyhash: '959c9f50aef1bc129a0e16564319a1b36515d570513079b6c73c72a5709abdce', // sha256('secr3t')
});

server.addEndpoint('/child_process', child_process);
server.addEndpoint('/execa', execa);
server.addEndpoint(new Pm2Endpoint());
server.start();
