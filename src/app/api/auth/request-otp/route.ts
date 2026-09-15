import { NextResponse, NextRequest } from 'next/server';
import { phoneSchema } from '@/lib/validation';
import { supabase } from '@/lib/supabase';
import { generateOTP, hashOTP, getOTPExpiry } from '@/lib/otp';
import { sendWhatsAppOTP } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    // Validate phone
    const validationResult = phoneSchema.safeParse(phone);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف غير صحيح' },
        { status: 400 }
      );
    }

    // Check rate limiting - max 3 requests per 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const { data: recentOTPs } = await supabase
      .from('otp_codes')
      .select('id')
      .eq('phone', phone)
      .gt('created_at', fifteenMinutesAgo.toISOString())
      .limit(1);

    if (recentOTPs && recentOTPs.length >= 3) {
      return NextResponse.json(
        { success: false, error: 'حاول لاحقاً - تم إرسال رموز كثيرة' },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = getOTPExpiry();

    // Save to database
    const { error: dbError } = await supabase
      .from('otp_codes')
      .insert([
        {
          phone,
          code: process.env.NODE_ENV === 'development' ? otp : '',
          code_hash: otpHash,
          expires_at: expiresAt.toISOString(),
        },
      ]);

    if (dbError) {
      return NextResponse.json(
        { success: false, error: 'فشل إرسال الرمز' },
        { status: 500 }
      );
    }

    // Send via WhatsApp
    const whatsappSent = await sendWhatsAppOTP(phone, otp);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق إلى WhatsApp',
      // Only show OTP in development
      ...(process.env.NODE_ENV === 'development' && { code: otp }),
    });
  } catch (error) {
    console.error('OTP request error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
