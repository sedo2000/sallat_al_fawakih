import { NextResponse, NextRequest } from 'next/server';
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

    return NextResponse.json({
      success: true,
      user: auth,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في التحقق' },
      { status: 500 }
    );
  }
}
