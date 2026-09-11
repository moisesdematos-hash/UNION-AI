import { Request, Response, NextFunction } from 'express';
import { authService, UserProfile } from '../services/auth.js';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Authorization header with Bearer token is required'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = authService.verifyToken(token);
    const user = authService.getUserById(payload.sub);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User belonging to token no longer exists'
      });
    }

    req.user = user;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid authentication token';
    return res.status(401).json({
      status: 'error',
      message
    });
  }
}
