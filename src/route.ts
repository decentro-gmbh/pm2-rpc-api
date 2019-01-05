import { ILogger } from './interfaces';

/**
 * Route class
 */

export abstract class Route {
  protected log: ILogger;

  constructor(log: ILogger) {
    this.log = log;
  }

  protected abstract getPath(): string;
  protected abstract getMiddleware(): Function;

  public register(server) {
    server.post(this.getPath(), this.getMiddleware());
  }

  protected handleError(req, res, next, err) {
    this.log.err(err);
    return res.status(500).json({
      error: {
        name: err[0].name,
        message: err[0].message,
        stack: err[0].stack,
      },
    });
  }
}
