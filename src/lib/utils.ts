import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
  }).format(price);
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/^0+/, '');
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}
