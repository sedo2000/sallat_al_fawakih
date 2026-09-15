'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Order } from '@/types';

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  preparing: 'قيد التحضير',
  out_for_delivery: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغى',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">طلباتي</h1>

      {loading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-gray-500">لا توجد طلبات</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">الطلب #{order.id}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-700'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    التاريخ: {new Date(order.created_at).toLocaleDateString('ar-IQ')}
                  </p>
                  <p className="text-sm text-gray-600">
                    المجموع: <span className="font-semibold text-green-600">{order.total.toFixed(3)} د.ع</span>
                  </p>
                  <Button className="text-sm">عرض التفاصيل</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
