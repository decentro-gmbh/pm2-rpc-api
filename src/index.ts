/**
 *
 */

import * as nconf from 'nconf';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { ILogger, IServerOptions } from './interfaces';
import { generateAuthMiddleware } from './authentication';
import { PM2 } from './routes/pm2';


export class Server {
  private envPrefix: string;
  private log: ILogger;

  private host: string;
  private port: number;
  private disabled: boolean;
  private authentication: boolean;
  private apikeyhash: null|string;

  constructor(options: IServerOptions = {}) {
    this.log = options.logger || {
      info: msg => console.log(`[INFO] ${msg}`), // tslint:disable-line:no-console
      warn: msg => console.log(`[WARNING] ${msg}`), // tslint:disable-line:no-console
      err: msg => console.log(`[ERROR] ${msg}`), // tslint:disable-line:no-console
    };

    this.envPrefix = (options.envPrefix || 'PM2API_').toLowerCase();
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

  /** Override in sub-class to extend the Express server, will be called before starting to listen */
  protected extendServer(server) {}

  /** Start the HTTP JSON-RCP API */
  public start(): void {
    if (this.disabled) {
      this.log.err('Server is disabled, exiting.');
      return;
    }

    const server = express();
    server.use(bodyParser.json());

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

    // Register routes
    const pm2 = new PM2(this.log);
    pm2.register(server);

    // Perform further server initialization
    this.extendServer(server);

    // Start listening
    server.listen(this.port, this.host, () => {
      this.log.info(`Server listening on ${this.host}:${this.port}`);
    });
  }

}
