/**
 *
 */

import * as nconf from 'nconf';
import * as express from 'express';

export interface IServerOptions {
  /** Server host */
  host?: string;
  /** Server port */
  port?: number;
  /** Whether the API is disabled by default. Results in the start() method exiting immediately (default: false) */
  disabled?: boolean;
  /** Namespace for environment variables (default: 'PM2API') */
  envNamespace?: string;
  /** Logging function for info messages (default: console.log) */
  info?: Function;
  /** Logging function for warnings (default: console.log) */
  warn?: Function;
  /** Logging function for errors (default: console.log) */
  err?: Function;
}


export class Server {
  private envNamespace: string;
  private info: Function;
  private warn: Function;
  private err: Function;

  private host: string;
  private port: number;
  private disabled: boolean;

  constructor(options: IServerOptions = {}) {
    this.envNamespace = options.envNamespace || 'PM2API';

    this.info = options.info || console.log; // tslint:disable-line:no-console
    this.warn = options.warn || console.log; // tslint:disable-line:no-console
    this.err = options.err || console.log; // tslint:disable-line:no-console

    this.initialize(options);
  }

  /** Initialize class attributes based on the provided command line arguments, environment variables and provided instance options */
  private initialize(options: IServerOptions) {
    const store = new nconf.Provider();

    // Add command line arguments
    store.argv();

    // Add environment variables
    store.env({
      separator: '_',
      lowerCase: true,
      parseValues: true,
      transform: (obj) => {
        // Only load environment variables starting with the given namespace
        if (!obj.key.startsWith(this.envNamespace)) {
          return false;
        }

        // Remove namespace from key
        return {
          key: obj.key.substring(this.envNamespace.length),
          value: obj.value,
        };
      },
    });

    // Add user-provided configurations
    store.add('literal', {
      host: options.host,
      port: options.port,
      disabled: options.disabled,
    });

    // Add default values
    store.defaults({
      host: 'localhost',
      port: 1337,
      disabled: false,
    });

    // Set final values for class attributes
    this.host = store.get('host');
    this.port = store.get('port');
    this.disabled = store.get('disabled');
  }

  /** Start the HTTP JSON-RCP API */
  start() {
    if (this.disabled) {
      this.err('Server is disabled, exiting.');
      return;
    }

    const server = express();
    server.listen(this.port, this.host, () => {
      this.info(`Server listening on ${this.host}:${this.port}`);
      this.warn('TODO: remove');
    });
  }

}
