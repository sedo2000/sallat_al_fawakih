'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (data.success) {
        // Redirect to OTP verification
        router.push(`/verify-otp?phone=${phone}`);
      } else {
        setError(data.error || 'فشل الطلب');
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
        <h1 className="text-2xl font-bold text-center mb-6">تسجيل الدخول</h1>
        <p className="text-gray-600 text-center mb-6">أدخل رقم هاتفك للتسجيل أو الدخول</p>

        <form onSubmit={handleRequestOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
            <Input
              type="tel"
              placeholder="07xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
          </Button>
        </form>
      </div>
    </div>
  );
}
