import { NextResponse, NextRequest } from 'next/server';
import { verifyOTPSchema } from '@/lib/validation';
import { supabase } from '@/lib/supabase';
import { verifyOTP } from '@/lib/otp';
import { setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    // Validate input
    const validationResult = verifyOTPSchema.safeParse({ phone, otp });
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة' },
        { status: 400 }
      );
    }

    // Get latest OTP for this phone
    const { data: otpRecords, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError || !otpRecords || otpRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'رمز التحقق غير صحيح أو انتهى' },
        { status: 400 }
      );
    }

    const otpRecord = otpRecords[0];

    // Check expiration
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية الرمز' },
        { status: 400 }
      );
    }

    // Check attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز عدد المحاولات' },
        { status: 429 }
      );
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, otpRecord.code_hash);

    if (!isValid) {
      // Increment attempts
      await supabase
        .from('otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      return NextResponse.json(
        { success: false, error: 'رمز التحقق غير صحيح' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ is_used: true })
      .eq('id', otpRecord.id);

    // Find or create user
    let { data: users, error: userFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone);

    let user;
    if (!users || users.length === 0) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ phone, phone_verified: true }])
        .select()
        .single();

      if (createError || !newUser) {
        return NextResponse.json(
          { success: false, error: 'فشل إنشاء حساب' },
          { status: 500 }
        );
      }
      user = newUser;
    } else {
      user = users[0];
      // Update verification status
      await supabase
        .from('users')
        .update({ phone_verified: true })
        .eq('id', user.id);
    }

    // Set auth cookie
    await setAuthCookie({
      userId: user.id,
      phone: user.phone,
      role: 'customer',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
