import { cookies } from 'next/headers';
import { generateToken, verifyToken, JWTPayload } from './jwt';

const TOKEN_NAME = 'auth-token';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function setAuthCookie(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const token = generateToken(payload);
  const cookieStore = await cookies();
  
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export async function getAuthToken(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  
  if (!token) return null;
  return verifyToken(token);
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}
