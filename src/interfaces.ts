
export interface IServerOptions {
  /** Server host */
  host?: string;
  /** Server port */
  port?: number;
  /** Whether the API is disabled by default. Results in the start() method exiting immediately (default: false) */
  disabled?: boolean;
  /** Enable authentication (default: false) */
  authentication?: boolean;
  /** Provide the SHA256 hash (in hexadecimal format) of the API key that is used for authentication */
  apikeyhash?: string;
  /** Namespace for environment variables (default: 'PM2API') */
  envNamespace?: string;
  /** Logger */
  logger?: ILogger;
}

export interface ILogger {
  /** Logging function for info messages (default: console.log) */
  info?: Function;
  /** Logging function for warnings (default: console.log) */
  warn?: Function;
  /** Logging function for errors (default: console.log) */
  err?: Function;
}
