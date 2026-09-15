import { NextResponse, NextRequest } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await clearAuthCookie();
    return NextResponse.json({ success: true, message: 'تم تسجيل الخروج' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'فشل تسجيل الخروج' },
      { status: 500 }
    );
  }
}
