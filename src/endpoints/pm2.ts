/**
 * PM2 RPC middlewares
 */

import * as pm2Sync from 'pm2';
import * as bluebird from 'bluebird';
import { RpcEndpoint } from '../rpc-endpoint';

const pm2 = bluebird.promisifyAll(pm2Sync);

export class Pm2Endpoint extends RpcEndpoint {
  constructor(log, rpcHelper) {
    super('/pm2', pm2, log, rpcHelper);
  }

  async execute(method, params) {
    try {
      const methodAsync = `${method}Async`;
      const result = await pm2[methodAsync](...params);
      return result;
    } catch (err) {
      if (Array.isArray(err)) {
        throw err[0];
      }
      throw err;
    }
  }
}
