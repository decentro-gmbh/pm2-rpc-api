/**
 * PM2 RPC middlewares
 */

import * as pm2Sync from 'pm2';
import * as bluebird from 'bluebird';
import { Route } from '../route';

const pm2 = bluebird.promisifyAll(pm2Sync);

export class PM2 extends Route {

  getPath() { return '/pm2'; }

  getMiddleware() {
    return async function pm2Middlware(req, res, next) {
      const { method, params } = req.body;

      const methodAsync = `${method}Async`;
      const fnParams = params || [];

      // Check if method exists
      if (!pm2[methodAsync] || typeof pm2[methodAsync] !== 'function') {
        return res.status(400).json({ code: -32601, error: 'METHOD_NOT_FOUND', message: `Method '${method}' is not available for PM2!` });
      }

      // Execute method
      try {
        const result = await pm2[methodAsync](...fnParams);
        return res.status(200).json({ result });
      } catch (err) {
        this.handleError(req, res, next, err);
      }
    }.bind(this);
  }
}
