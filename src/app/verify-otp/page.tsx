'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/');
      } else {
        setError(data.error || 'فشل التحقق');
      }
    } catch (err) {
      setError('حدث خطأ في الخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-2">التحقق من الهاتف</h1>
        <p className="text-gray-600 text-center mb-6">أدخل رمز التحقق المرسل إلى WhatsApp</p>
        <p className="text-center text-sm text-gray-500 mb-6">{phone}</p>

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">رمز التحقق</label>
            <Input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              disabled={loading}
              required
              className="text-center text-2xl tracking-widest"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading || otp.length !== 6} className="w-full">
            {loading ? 'جاري التحقق...' : 'تحقق'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>لم تستقبل الرمز؟</p>
          <Button
            type="button"
            className="mt-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={() => router.push('/login')}
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    </div>
  );
}
