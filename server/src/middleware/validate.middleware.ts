import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    console.log(`--- validate middleware started for source: ${source} ---`);
    const dataToValidate = req[source];
    
    const result = schema.safeParse(dataToValidate);
    if (!result.success) {
      console.log(`validate middleware: validation failed`, JSON.stringify(result.error.issues, null, 2));
      const errorMessage = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') || 'Validation failed';
      return next(new ValidationError(errorMessage));
    }
    // Safely assign validated data back to the request
    if (source === 'query') {
      // req.query is a getter in Express, so we must mutate it safely
      Object.assign(req.query, result.data);
    } else {
      req[source] = result.data;
    }
    
    console.log(`validate middleware: success, calling next()`);
    next();
  };
};
