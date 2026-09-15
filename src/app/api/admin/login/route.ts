import { NextResponse, NextRequest } from 'next/server';
import bcryptjs from 'bcryptjs';
import { setAuthCookie } from '@/lib/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sallat-al-fawakih.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'بيانات دخول غير صحيحة' },
        { status: 401 }
      );
    }

    // In production, hash should be stored and compared
    // For development, we use environment variable directly
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'بيانات دخول غير صحيحة' },
        { status: 401 }
      );
    }

    // Set admin cookie
    await setAuthCookie({
      userId: 'admin',
      email: ADMIN_EMAIL,
      role: 'admin',
    });

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
