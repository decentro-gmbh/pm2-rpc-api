/** Interface for options that can be passed during server initialization */
export interface IServerOptions {
  /** Server host (default: 'localhost') */
  host?: string;
  /** Server port (default: 1337) */
  port?: number;
  /** Whether the server is disabled by default. Results in the start() method exiting immediately (default: false) */
  disabled?: boolean;
  /** Enable authentication (default: false) */
  authentication?: boolean;
  /** Provide the SHA256 hash (in hexadecimal format) of the API key that is used for authentication */
  apikeyhash?: string;
  /** Prefix for environment variables (default: 'PM2API') */
  envPrefix?: string;
  /** Logger */
  logger?: ILogger;
  /** Request logging format, for all options see: https://www.npmjs.com/package/morgan (default: 'short') */
  requestLoggingFormat?: string;
}

export interface IEndpointOptions {
  /** Whether to coerce requests without the 'jsonrpc' member to valid JSON-RPC 2.0 requests (adding 'jsonrpc': '2.0' and 'id': null, assuming the client is interested in the response) */
  coerceRequestsToJsonRpc2?: boolean;
}

/** Interface for a logger object used to print log messages */
export interface ILogger {
  /** Logging function for info messages (default: console.log) */
  info?: (msg: string) => void;
  /** Logging function for warnings (default: console.log) */
  warn?: (msg: string) => void;
  /** Logging function for errors (default: console.error) */
  err?: (msg: string) => void;
}

/** Interface for modules that are exposed via an RPC endpoint */
export interface IRpcModule {
  /** Only the module's functions are relevant for RPC calls */
  [x: string]: Function;
}

/** Interface for JSON-RPC 2.0 requests (https://www.jsonrpc.org/specification#request_object) */
export interface IRpcRequest {
  /** A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0". */
  jsonrpc: string;
  /** An identifier established by the client. If it is not included, it is assumed to be a notification. */
  id: string | number | null;
  /** A String containing the name of the method to be invoked. */
  method: string;
  /** A structured value that holds the parameter values to be used during the invocation of the method. */
  params: undefined | any[];
}

/** Interface for JSON-RPC 2.0 responses (https://www.jsonrpc.org/specification#response_object) */
export interface IRpcResponse {
  /** A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0". */
  jsonrpc: string;
  /** Identifier whose value corresponds to the one given in the RPC request. */
  id: string | number | null;
  /** Result of the RPC call on successful execution. */
  result?: any[] | object;
  /** Error that occurred during the execuetion of the RPC call. */
  error?: IRpcError;
}

/** Interface for JSON-RPC 2.0 errors (https://www.jsonrpc.org/specification#error_object) */
export interface IRpcError {
  /** A Number that indicates the error type that occurred. See RFC for possible values */
  code: number;
  /** A String providing a short description of the error. */
  message: string;
  /** A Primitive or Structured value that contains additional information about the error. */
  data?: any;
}
