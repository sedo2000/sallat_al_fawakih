'use client';

import { Product } from '@/types';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {product.image_url ? (
          <div className="relative w-full h-48 bg-gray-200">
            <Image
              src={product.image_url}
              alt={product.name_ar}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-4xl">🥕</span>
          </div>
        )}
        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2">{product.name_ar}</h3>
          <p className="text-xs text-gray-500 mb-2">{product.unit}</p>
          <div className="flex justify-between items-center">
            <div>
              {product.old_price && (
                <p className="text-xs line-through text-gray-400">
                  {formatPrice(product.old_price)}
                </p>
              )}
              <p className="font-bold text-green-600">{formatPrice(product.price)}</p>
            </div>
            {product.discount > 0 && (
              <div className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
                -{product.discount}%
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
