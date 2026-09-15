import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthToken();

    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
