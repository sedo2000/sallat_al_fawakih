import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthToken } from '@/lib/auth';

interface CheckoutItem {
  product_id: number;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthToken();

    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items, address_id, payment_method, notes } = body;

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'السلة فارغة' },
        { status: 400 }
      );
    }

    // Verify address belongs to user
    const { data: address, error: addrError } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', address_id)
      .eq('user_id', auth.userId)
      .single();

    if (addrError || !address) {
      return NextResponse.json(
        { success: false, error: 'العنوان غير صحيح' },
        { status: 400 }
      );
    }

    // Fetch product prices from database (never trust client prices)
    const productIds = items.map((item: CheckoutItem) => item.product_id);
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, price')
      .in('id', productIds);

    if (productError || !products) {
      return NextResponse.json(
        { success: false, error: 'خطأ في جلب المنتجات' },
        { status: 500 }
      );
    }

    // Calculate actual prices
    let subtotal = 0;
    const orderItems = items.map((item: CheckoutItem) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) throw new Error('منتج غير صحيح');
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price,
      };
    });

    // Calculate fees
    const discount_amount = 0; // TODO: Handle discounts
    const delivery_fee = 2.5; // Fixed delivery fee
    const total = subtotal + delivery_fee - discount_amount;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: auth.userId,
          address_id,
          status: 'pending',
          subtotal,
          discount_amount,
          delivery_fee,
          total,
          payment_method: payment_method || 'cash',
          notes,
        },
      ])
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'فشل إنشاء الطلب' },
        { status: 500 }
      );
    }

    // Add order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        orderItems.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        }))
      );

    if (itemsError) {
      return NextResponse.json(
        { success: false, error: 'فشل إنشاء عناصر الطلب' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
