'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from './ui/Button';

export function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-green-600">
          🥗 سلة الفاكهة
        </Link>
        <nav className="flex gap-4 items-center">
          <Link href="/search" className="text-gray-700 hover:text-green-600">
            بحث
          </Link>
          <Link href="/cart" className="text-gray-700 hover:text-green-600">
            السلة
          </Link>
          <Link href="/favorites" className="text-gray-700 hover:text-green-600">
            المفضلة
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/orders" className="text-gray-700 hover:text-green-600">
                الطلبات
              </Link>
              <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-sm">
                تسجيل الخروج
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button>تسجيل الدخول</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
