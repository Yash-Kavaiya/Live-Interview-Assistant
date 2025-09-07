import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // In production, verify the JWT token
  // For now, we'll just check if it's present
  if (token === 'demo-token') {
    req.user = {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
    };
    next();
  } else {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token && token === 'demo-token') {
    req.user = {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
    };
  }

  next();
}

export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // In production, validate against your API key store
  if (apiKey === process.env.API_KEY || apiKey === 'demo-api-key') {
    next();
  } else {
    return res.status(403).json({ error: 'Invalid API key' });
  }
}