
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
  /** Prefix for environment variables (default: 'PM2API') */
  envPrefix?: string;
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

export interface IRpcRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: undefined|Array<any>;
}

export interface IRpcResponse {
  jsonrpc: string;
  id: number;
  result?: Array<any>|Object;
  error?: IRpcError;
}

export interface IRpcError {
  code: number;
  message: string;
  data: any;
}
