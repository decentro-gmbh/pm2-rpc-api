import * as Ajv from 'ajv';
import { ILogger } from './interfaces';
import { rpcRequestSchema } from './rpc-schema';
import * as uuidv4 from 'uuid/v4';

/**
 * JSON-RPC endpoint
 * https://www.jsonrpc.org/specification
 */

export class RpcEndpoint {

  protected path: string;
  protected target: any;
  protected log: ILogger;
  protected validate: Ajv.ValidateFunction;
  protected rpcHelper: boolean;

  constructor(path: string, target: any, log: ILogger, rpcHelper: boolean = false) {
    this.path = path;
    this.target = target;
    this.log = log;
    this.rpcHelper = rpcHelper;
  }

  /** Convenience method that normalizes the request body by always returning an array of rpc requests, even if only one is specified (both is allowed by the RFC) */
  static getRpcRequests(req) {
    return Array.isArray(req.body) ? req.body : [req.body];
  }

  /** Assume that the client is not JSON-RPC aware but implicitly wants to use JSON-RPC 2.0 and is interested in the respones (ID must be set) */
  static rpcHelperMiddleware(req, res, next) {
    RpcEndpoint.getRpcRequests(req).forEach((rpcRequest) => {
      if (typeof rpcRequest === 'object' && !rpcRequest.jsonrpc) {
      rpcRequest.jsonrpc = '2.0';
      rpcRequest.id = rpcRequest.id || uuidv4();
      }
    });

    return next();
  }

  /** Check whether the incoming request body is a valid JSON-RPC 2.0 request object (throw an error and terminate the request otherwise)  */
  static validateRequestBody(req, res, next) {
    const ajv = new Ajv();
    const validate: Ajv.ValidateFunction = ajv.compile(rpcRequestSchema);
    if (!validate(req.body)) {
      return res.status(400).json({
        code: -32600,
        message: 'Invalid Request: The JSON sent is not a valid request object.',
        data: validate.errors,
      });
    }

    return next();
  }

  /** Check if the specified method is available on the target */
  protected checkMethodExistence(req, res, next) {
    RpcEndpoint.getRpcRequests(req).forEach((rpcReq) => {
      if (!this.target[rpcReq.method] || typeof this.target[rpcReq.method] !== 'function') {
        return res.status(400).json({
          code: -32601,
          message: `Method not found: The method '${rpcReq.method}' does not exist / is not available.`,
        });
      }
    });

    return next();
  }

  protected async execute(method, params) {
    const result = await this.target[method](...params);
    return result;
  }

  protected async executeRpcCall(req, res, next) {
    const rpcRequests = RpcEndpoint.getRpcRequests(req);

    const results = await Promise.all(rpcRequests.map(async (rpcRequest) => {
      try {
        const result = await this.execute(rpcRequest.method, rpcRequest.params || []);
        return { result };
      } catch (err) {
        return {
          error: {
            code: -32000,
            message: `${err.name}: ${err.message}`,
            data: err.stack,
          },
        };
      }
    }));

    const responses = results.map((result, index) => {
      return {
        jsonrpc: '2.0',
        id: rpcRequests[index].id,
        ...result,
      };
    });

    if (!Array.isArray(req.body)) {
      return res.status(200).json([responses]);
    }

    return res.status(200).json(responses);
  }

  public register(server) {
    if (this.rpcHelper) {
      server.post(this.path, RpcEndpoint.rpcHelperMiddleware);
    }
    server.post(this.path, RpcEndpoint.validateRequestBody);
    server.post(this.path, this.checkMethodExistence.bind(this));
    server.post(this.path, this.executeRpcCall.bind(this));
  }
}
