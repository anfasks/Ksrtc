import { NextFunction, Request, Response } from 'express';

import { AuthenticatedUser, UserRole } from '../types';
import { verifyAccessToken } from './tokenService';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export function authenticate(required = true) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) {
      if (required) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Missing Authorization header' });
      }
      return next();
    }
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid Authorization header' });
    }
    const user = verifyAccessToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
    req.user = user;
    return next();
  };
}

export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden', message: `Requires ${role} role` });
    }
    return next();
  };
}
