'use client';

import { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="px-4 py-3 border-b border-gray-200">{children}</div>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="p-4">{children}</div>;
}
