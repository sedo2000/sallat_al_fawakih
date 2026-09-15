'use client';

import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500',
        className
      )}
      {...props}
    />
  );
}
