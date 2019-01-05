/**
 * Example server
 */

import { Server } from '../src/index';

const server = new Server({
  authentication: true,
  apikeyhash: 'b37e50cedcd3e3f1ff64f4afc0422084ae694253cf399326868e07a35f4a45fb',
});

server.start();
