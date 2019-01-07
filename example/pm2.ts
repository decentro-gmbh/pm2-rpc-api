import * as pm2Sync from 'pm2';
import * as bluebird from 'bluebird';
import { RpcEndpoint } from '../src/rpc-server';

// Promisify pm2 to eliminate callbacks
const pm2 = bluebird.promisifyAll(pm2Sync);

/** Pm2 RPC endpoint class */
export class Pm2Endpoint extends RpcEndpoint {
  constructor() {
    super('/pm2', pm2, true);
  }

  /** Execute pm2 RPC call, use the async pendant of the requested method and remove pm2's array wrapping around returned result and error objects  */
  async execute(method, params) {
    try {
      const result = await super.execute(`${method}Async`, params);
      return Array.isArray(result) ? result[0] : result;
    } catch (err) {
      throw Array.isArray(err) ? err[0] : err;
    }
  }
}
