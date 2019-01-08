import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Server } from 'http';
import * as morgan from 'morgan';
import * as nconf from 'nconf';
import { Writable } from 'stream';
import { generateAuthMiddleware } from './authentication';
import { HTTP, RPC } from './constants';
import { IEndpointOptions, ILogger, IServerOptions } from './interfaces';
import { RpcEndpoint } from './rpc-endpoint';
export { RpcEndpoint } from './rpc-endpoint';

/** RPC Server class */
export class RpcServer {
  private envPrefix: string;
  private log: ILogger;
  private requestLoggingFormat: string;
  private host: string;
  private port: number;
  private disabled: boolean;
  private authentication: boolean;
  private apikeyhash: null | string;

  private endpoints: RpcEndpoint[] = [];
  private httpServer: Server = null;

  constructor(options: IServerOptions = {}) {
    this.log = options.logger || {
      info: (msg) => console.log(`[INFO] ${msg}`), // tslint:disable-line:no-console
      warn: (msg) => console.log(`[WARNING] ${msg}`), // tslint:disable-line:no-console
      err: (msg) => console.error(`[ERROR] ${msg}`), // tslint:disable-line:no-console
    };
    this.requestLoggingFormat = options.requestLoggingFormat || 'short';

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
      rpcEndpoint.setLogger(this.log);
      rpcEndpoint.register(server);
    });
  }

  /**
   * Add an RPC endpoint
   * @param path Path of the endpoint (e.g., '/execute')
   * @param module Module whose methods can be executed via the RPC endpoint
   * @param options RPC endpoint options
   */
  public addEndpoint(path: string, module: any, options?: IEndpointOptions);
  /**
   *  Add a custom RPC endpoint
   * @param rpcEndpoint Instance of a class extending the 'RpcEndpoint' class
   */
  public addEndpoint(rpcEndpoint: RpcEndpoint): void;
  public addEndpoint(param1: string | RpcEndpoint, param2?: any, param3?: IEndpointOptions) {
    if (typeof param1 === 'string' && param2) {
      const path: string = param1;
      const module = param2;
      const options = param3;
      const rpcEndpoint = new RpcEndpoint(path, module, options);
      this.endpoints.push(rpcEndpoint);

    } else if (typeof param1 === 'object') {
      const rpcEndpoint: RpcEndpoint = param1;
      this.endpoints.push(rpcEndpoint);
    }
  }

  /**
   * Start the RPC server:
   *   - Register middlewares for each added RPC endpoint
   *   - Listen on specified host and port
   */
  public async start(): Promise<Server> {
    if (this.disabled) {
      this.log.err('Server is disabled, exiting.');
      return null;
    }

    const app = express();
    app.use(bodyParser.json());
    app.disable('x-powered-by');

    // Regsiter logging middleware
    const log = this.log;
    app.use(morgan(this.requestLoggingFormat, {
      /** Convert logging function to stream as morgan expects a stream as input */
      stream: new Writable({ write(chunk, encoding, cb) { log.info(chunk); cb(); } }),
    }));

    // Register authentication middleware
    if (!this.authentication && this.apikeyhash) {
      this.log.warn('An API key hash was provided but authentication is disabled, NOT authenticating API requests!');
    } else if (this.authentication && !this.apikeyhash) {
      this.log.err('Authentication is enabled but no API key hash is given, exiting.');
      process.exit(1);
    } else if (this.authentication && this.apikeyhash) {
      app.use('*', generateAuthMiddleware(this.apikeyhash, this.log));
    } else {
      this.log.info('Authentication disabled');
    }

    // Register RPC endpoints
    this.registerRpcEndpoints(app);

    // Register error middleware
    app.use(function errorMiddleware(err, req, res, next) {
      if (err.type === 'entity.parse.failed') {
        return res.status(HTTP.BAD_REQUEST).json({
          code: RPC.ERROR.PARSE_ERROR,
          message: 'Parse error: Invalid JSON was received by the server.',
          data: err.stack,
        });
      }

      return res.status(HTTP.INTERNAL_SERVER_ERROR).json({
        code: RPC.ERROR.SERVER_ERROR,
        message: 'An unexpected server error has occurred',
        data: err.stack,
      });
    });

    // Start listening
    await new Promise((resolve, reject) => {
      this.httpServer = app.listen(this.port, this.host, () => {
        this.log.info(`Server listening on ${this.host}:${this.port}`);
        resolve();
      });
    });

    return this.httpServer;
  }

  /** Stop the RPC server (print an error message if the server is not running) */
  public async stop(): Promise<void> {
    await new Promise((resolve, reject) => {
      if (this.httpServer) {
        this.httpServer.close(() => {
          this.log.info('Server stopped.');
          resolve();
        });
      } else {
        this.log.err('Cannot stop server: server has not been started!');
      }
    });
  }

}
