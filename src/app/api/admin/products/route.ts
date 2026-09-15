import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthToken } from '@/lib/auth';
import { productSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthToken();

    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .insert([validation.data])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthToken();

    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
