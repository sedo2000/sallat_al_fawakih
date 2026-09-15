import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error('JWT_SECRET is not defined');
}

const secretKey = new TextEncoder().encode(secret);

export interface JWTPayload {
  userId: string;
  email?: string;
  phone?: string;
  role?: 'customer' | 'admin';
  iat?: number;
  exp?: number;
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn = '7d'): string {
  return jwt.sign(payload, secret!, { expiresIn });
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = await jwtVerify(token, secretKey);
    return decoded.payload as JWTPayload;
  } catch (error) {
    return null;
  }
}
