import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthToken();

    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 403 }
      );
    }

    // Get statistics
    const { data: totalOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'delivered');

    const { data: todayOrders } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'pending');

    const { data: totalCustomers } = await supabase
      .from('users')
      .select('id');

    const { data: products } = await supabase
      .from('products')
      .select('id');

    return NextResponse.json({
      success: true,
      data: {
        totalOrders: totalOrders?.length || 0,
        todayOrders: todayOrders?.length || 0,
        pendingOrders: pendingOrders?.length || 0,
        totalCustomers: totalCustomers?.length || 0,
        totalProducts: products?.length || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
