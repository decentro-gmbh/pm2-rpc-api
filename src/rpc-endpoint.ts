import * as Ajv from 'ajv';
import { Express } from 'express';
import { ILogger, IRpcResponse, IRpcRequest, IRpcModule, IEndpointOptions } from './interfaces';
import { rpcRequestSchema } from './rpc-schema';

/**
 * JSON-RPC 2.0 endpoint class
 * https://www.jsonrpc.org/specification
 */
export class RpcEndpoint {
  /** Path the endpoint is registered at */
  protected path: string;
  /** Module whose methods can be called via the RPC endpoint */
  protected module: IRpcModule;
  /** Logger used to print log messages */
  protected log: ILogger;
  /** Whether to coerce requests without the 'jsonrpc' member to valid JSON-RPC 2.0 requests */
  private coerceRequestsToJsonRpc2: boolean;

  constructor(path: string, module: any, options: IEndpointOptions = {}) {
    this.path = path;
    this.module = module;
    this.coerceRequestsToJsonRpc2 = options.coerceRequestsToJsonRpc2;
  }

  /** Convenience method that normalizes the request body by always returning an array of rpc requests, even if only one is specified (both is allowed by the RFC) */
  static getRpcRequests(req): Array<IRpcRequest> {
    return Array.isArray(req.body) ? req.body : [req.body];
  }

  /**
   * Attempt to coerce each request to be a valid JSON-RPC 2.0 request:
   *   - Add 'jsonrpc': '2.0'
   *   - Add 'id': null if no 'id' member was provided, assuming the client is interested in the response
   */
  static coerceRequestsToJsonRpc2Middleware(req, res, next) {
    RpcEndpoint.getRpcRequests(req).forEach((rpcRequest) => {
      if (typeof rpcRequest === 'object' && !rpcRequest.hasOwnProperty('jsonrpc')) {
        rpcRequest.jsonrpc = '2.0';
        if (!rpcRequest.hasOwnProperty('id')) {
          rpcRequest.id = null;
        }
      }
    });

    return next();
  }

  /** Check whether the incoming request body is a valid JSON-RPC 2.0 request object (terminate the request otherwise)  */
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

  /**
   * Check whether the specified method exists
   * @param method Method name to check
   * @throws Throws a 'Method not found' error if the method does not exist
   */
  private checkMethodExistence(method: string) {
    if (!this.module[method] || typeof this.module[method] !== 'function') {
      throw {
        name: 'Method not found',
        message: `The method '${method}' does not exist / is not available.`,
        rpcErrCode: -32601,
      };
    }
  }

  /**
   * Execute the RPC
   * @param method Method to execute
   * @param params Parameters passed to the method invocation
   */
  protected async execute(method: string, params: Array<any>): Promise<any> {
    const result = await this.module[method](...params);
    return result;
  }

  /** Middleware for executing the RPC call as specified in the RPC request */
  private async executeRpc(req, res, next) {
    const rpcRequests = RpcEndpoint.getRpcRequests(req);

    const results = await Promise.all(rpcRequests.map(async (rpcRequest) => {
      try {
        this.checkMethodExistence(rpcRequest.method);

        // Execute RPC
        const execPromise = this.execute(rpcRequest.method, rpcRequest.params || []);

        // Check if the client requested a notification
        if (rpcRequest.hasOwnProperty('id')) {
          // Normal call -> wait for the method call to finish and return the result
          const result = await execPromise;
          return { result };
        } else {
          // Notification -> do not wait for the method call to finish and return immediately
          return { result: {} };
        }

      } catch (err) {
        return {
          error: {
            code: err.rpcErrCode || -32000,
            message: `${err.name}: ${err.message}`,
            data: err.stack,
          },
        };
      }
    }));

    const responses: Array<IRpcResponse> = results.map((result, index) => {
      return {
        jsonrpc: '2.0',
        id: rpcRequests[index].id,
        ...result,
      };
    });

    const statusCode = responses.filter(rsp => rsp.error).length > 0 ? 500 : 200;

    if (!Array.isArray(req.body)) {
      return res.status(statusCode).json(responses[0]);
    }

    return res.status(statusCode).json(responses);
  }

  /**
   * Register the RPC endpoint with the given Express server
   * @param server Express server object
   */
  public register(server: Express) {
    if (this.coerceRequestsToJsonRpc2) {
      server.post(this.path, RpcEndpoint.coerceRequestsToJsonRpc2Middleware);
    }
    server.post(this.path, RpcEndpoint.validateRequestBody);
    server.post(this.path, this.executeRpc.bind(this));
  }

  /** Setter for the 'log' attribute */
  public setLogger(logger: ILogger): void {
    this.log = logger;
  }

  /** Getter for the 'path' attribute */
  public getPath(): string {
    return this.path;
  }
}
