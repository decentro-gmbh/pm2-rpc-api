import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Express } from 'express';
import * as nconf from 'nconf';
import { ILogger, IServerOptions } from './interfaces';
import { generateAuthMiddleware } from './authentication';
import { RpcEndpoint } from './rpc-endpoint';
export { RpcEndpoint } from './rpc-endpoint';


/** RPC Server class */
export class RpcServer {
  private envPrefix: string;
  private log: ILogger;

  private host: string;
  private port: number;
  private disabled: boolean;
  private authentication: boolean;
  private apikeyhash: null | string;

  private endpoints: Array<RpcEndpoint> = [];

  constructor(options: IServerOptions = {}) {
    this.log = options.logger || {
      info: msg => console.log(`[INFO] ${msg}`), // tslint:disable-line:no-console
      warn: msg => console.log(`[WARNING] ${msg}`), // tslint:disable-line:no-console
      err: msg => console.log(`[ERROR] ${msg}`), // tslint:disable-line:no-console
    };

    this.envPrefix = (options.envPrefix || 'RPC_SERVER_').toLowerCase();
    this.log.info(`Loading environment variables with prefix: '${this.envPrefix.toUpperCase()}'`);

    this.initialize(options);
  }

  /** Initialize class attributes based on the provided command line arguments, environment variables and provided instance options */
  private initialize(options: IServerOptions): void {
    const store = new nconf.Provider();

    // Add command line arguments
    store.argv();

    // Add environment variables
    store.env({
      separator: '_',
      lowerCase: true,
      parseValues: true,
      transform: (obj) => {
        // Only load environment variables starting with the given prefix
        if (!obj.key.startsWith(this.envPrefix)) {
          return false;
        }

        // Remove prefix from key
        return {
          key: obj.key.substring(this.envPrefix.length),
          value: obj.value,
        };
      },
    });

    // Add user-provided configurations
    store.add('literal', {
      host: options.host,
      port: options.port,
      disabled: options.disabled,
      authentication: options.authentication,
      apikeyhash: options.apikeyhash,
    });

    // Add default values
    store.defaults({
      host: 'localhost',
      port: 1337,
      disabled: false,
      authentication: false,
      apikeyhash: null,
    });

    // Set final values for class attributes
    this.host = store.get('host');
    this.port = store.get('port');
    this.disabled = store.get('disabled');
    this.authentication = store.get('authentication');
    this.apikeyhash = store.get('apikeyhash');
  }

  /** Register all endpoints to the given server object */
  protected registerRpcEndpoints(server) {
    this.endpoints.forEach((rpcEndpoint) => {
      this.log.info(`Registering new endpoint: ${rpcEndpoint.getPath()}`);
      rpcEndpoint.register(server);
    });
  }

  public addEndpoint(path: string, module?: any);
  public addEndpoint(rpcEndpoint: RpcEndpoint): void;
  public addEndpoint(param1: string | RpcEndpoint, param2?: any) {
    if (typeof param1 === 'string' && param2) {
      const path: string = param1;
      const module = param2;
      const rpcEndpoint = new RpcEndpoint(path, module);
      this.endpoints.push(rpcEndpoint);
    } else if (typeof param1 === 'object') {
      const rpcEndpoint: RpcEndpoint = param1;
      this.endpoints.push(rpcEndpoint);
    }
  }

  /** Start the HTTP JSON-RPC API */
  public start(): Express {
    if (this.disabled) {
      this.log.err('Server is disabled, exiting.');
      return null;
    }

    const server = express();
    server.use(bodyParser.json());
    server.disable('x-powered-by');

    // Register authentication middleware
    if (!this.authentication && this.apikeyhash) {
      this.log.warn('An API key hash was provided but authentication is disabled, NOT authenticating API requests!');
    } else if (this.authentication && !this.apikeyhash) {
      this.log.err('Authentication is enabled but no API key hash is given, exiting.');
      process.exit(1);
    } else if (this.authentication && this.apikeyhash) {
      server.use('*', generateAuthMiddleware(this.apikeyhash, this.log));
    } else {
      this.log.info('Authentication disabled');
    }

    // Register RPC endpoints
    this.registerRpcEndpoints(server);

    // Error middleware
    server.use(function errorMiddleware(err, req, res, next) {
      if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
          code: -32700,
          message: 'Parse error: Invalid JSON was received by the server.',
          data: err.stack,
        });
      }
      return res.status(500).json({

      });
    });

    // Start listening
    server.listen(this.port, this.host, () => {
      this.log.info(`Server listening on ${this.host}:${this.port}`);
    });

    return server;
  }

}
