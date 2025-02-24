import {Handler, NextFunction, Request, Response} from 'express';

export type RequireQueryParams<T extends string[]> = Request & {
  query: {[K in T[number]]: string};
};

export function queryParamValidator<T extends string[]>(
  paramNames: T
): Handler {
  return (req: Request, res: Response, next: NextFunction): any => {
    const missingParams: string[] = [];
    for (let param of paramNames) {
      if (!(param in req.query)) {
        missingParams.push(param);
      }
    }

    if (missingParams.length > 0) {
      return res.status(400).json({
        message: `Missing following query parameters: ${missingParams
          .map((param) => `"${param}"`)
          .join(', ')}`,
      });
    }

    next();
  };
}
