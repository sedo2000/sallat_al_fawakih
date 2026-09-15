'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

interface CartItem {
  product_id: number;
  quantity: number;
  name: string;
  price: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const items = JSON.parse(savedCart);
      setCartItems(items);
      calculateTotal(items);
    }
  }, []);

  const calculateTotal = (items: CartItem[]) => {
    const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotal(sum);
  };

  const removeItem = (productId: number) => {
    const updated = cartItems.filter((item) => item.product_id !== productId);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    calculateTotal(updated);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    const updated = cartItems.map((item) =>
      item.product_id === productId ? { ...item, quantity } : item
    );
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    calculateTotal(updated);
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      const authData = await res.json();

      if (!authData.success) {
        window.location.href = '/login';
        return;
      }

      // Redirect to checkout
      window.location.href = '/checkout';
    } catch (error) {
      alert('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">سلتك</h1>

      {cartItems.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-gray-500">سلتك فارغة</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.product_id}>
                <CardBody>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-gray-600">السعر: {item.price} د.ع</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.product_id, parseInt(e.target.value))
                        }
                        className="w-16 px-2 py-1 border rounded"
                      />
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <div>
            <Card>
              <CardHeader>
                <h3 className="font-semibold">الملخص</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>المجموع الجزئي</span>
                    <span>{total.toFixed(3)} د.ع</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>الإجمالي</span>
                    <span>{total.toFixed(3)} د.ع</span>
                  </div>
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full"
                >
                  المتابعة للدفع
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
