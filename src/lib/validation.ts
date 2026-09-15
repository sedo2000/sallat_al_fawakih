import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^[0-9]{10,15}$/, 'رقم الهاتف غير صحيح');

export const emailSchema = z.string().email('البريد الإلكتروني غير صحيح');

export const otpSchema = z
  .string()
  .regex(/^[0-9]{6}$/, 'رمز التحقق يجب أن يكون 6 أرقام');

export const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير')
  .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير')
  .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم');

export const loginPhoneSchema = z.object({
  phone: phoneSchema,
});

export const loginEmailSchema = z.object({
  email: emailSchema,
});

export const verifyOTPSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const addressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(1, 'الشارع مطلوب'),
  building: z.string().optional(),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().min(1, 'المدينة مطلوبة'),
  district: z.string().optional(),
  notes: z.string().optional(),
  is_default: z.boolean().default(false),
});

export const productSchema = z.object({
  name_ar: z.string().min(1, 'الاسم بالعربية مطلوب'),
  name_en: z.string().min(1, 'الاسم بالإنجليزية مطلوب'),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  price: z.number().positive('السعر يجب أن يكون موجب'),
  old_price: z.number().positive().optional(),
  discount: z.number().min(0).max(100).default(0),
  unit: z.string().optional(),
  category_id: z.number().int().positive(),
  image_url: z.string().url().optional(),
  stock: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
});

export type LoginPhoneInput = z.infer<typeof loginPhoneSchema>;
export type LoginEmailInput = z.infer<typeof loginEmailSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
