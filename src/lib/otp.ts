import crypto from 'crypto';
import bcryptjs from 'bcryptjs';

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function hashOTP(otp: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(otp, salt);
}

export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(otp, hash);
}

export function getOTPExpiry(): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5); // 5 minutes expiry
  return now;
}
