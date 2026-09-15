'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/dashboard');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">لوحة التحكم</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats?.totalOrders}</div>
              <p className="text-gray-600 text-sm mt-2">إجمالي الطلبات</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats?.todayOrders}</div>
              <p className="text-gray-600 text-sm mt-2">طلبات اليوم</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats?.pendingOrders}</div>
              <p className="text-gray-600 text-sm mt-2">طلبات معلقة</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats?.totalCustomers}</div>
              <p className="text-gray-600 text-sm mt-2">العملاء</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-pink-600">{stats?.totalProducts}</div>
              <p className="text-gray-600 text-sm mt-2">المنتجات</p>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">الخيارات السريعة</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <a href="/admin/products" className="block p-3 bg-green-50 hover:bg-green-100 rounded text-green-700 font-semibold">
                  إدارة المنتجات
                </a>
                <a href="/admin/orders" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 font-semibold">
                  إدارة الطلبات
                </a>
                <a href="/admin/categories" className="block p-3 bg-purple-50 hover:bg-purple-100 rounded text-purple-700 font-semibold">
                  إدارة الفئات
                </a>
                <a href="/admin/customers" className="block p-3 bg-orange-50 hover:bg-orange-100 rounded text-orange-700 font-semibold">
                  إدارة العملاء
                </a>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">آخر الأنشطة</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-500 text-center py-6">لا توجد أنشطة حالياً</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
