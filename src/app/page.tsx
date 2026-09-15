'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-green-500 to-green-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">أطعم الفاكهة والخضروات الطازة</h1>
          <p className="text-xl mb-6">توصيل سريع لباب منزلك</p>
          <Button className="bg-white text-green-600 hover:bg-gray-100">ابدأ التسوق الآن</Button>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">المنتجات المميزة</h2>
        {loading ? (
          <div className="text-center py-12">جاري التحميل...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">لا توجد منتجات متاحة حالياً</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">الفئات</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['فاكهة', 'خضروات', 'أعشاب', 'منتجات الألبان'].map((cat) => (
              <div
                key={cat}
                className="bg-green-50 rounded-lg p-6 text-center hover:bg-green-100 cursor-pointer transition"
              >
                <div className="text-4xl mb-2">🥬</div>
                <p className="font-semibold">{cat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
