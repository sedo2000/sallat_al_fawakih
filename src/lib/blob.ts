import { put, del } from '@vercel/blob';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export interface UploadResult {
  url: string;
  size: number;
  contentType: string;
}

export async function uploadImage(
  file: File,
  folder = 'products'
): Promise<UploadResult> {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('نوع الملف غير مدعوم');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('حجم الملف كبير جداً');
  }

  // Validate extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext)
  );

  if (!hasValidExtension) {
    throw new Error('امتداد الملف غير صحيح');
  }

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const blobName = `${folder}/${timestamp}-${randomStr}-${file.name}`;

  try {
    const blob = await put(blobName, file, {
      access: 'public',
      contentType: file.type,
    });

    return {
      url: blob.url,
      size: file.size,
      contentType: file.type,
    };
  } catch (error) {
    throw new Error('فشل تحميل الصورة');
  }
}

export async function deleteImage(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}
