import type { Metadata } from 'next';
import '@/globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'سلة الفاكهة - متجر الفاكهة والخضروات',
  description: 'متجر تجارة إلكترونية لبيع الفاكهة والخضروات الطازة بأفضل الأسعار',
  keywords: ['فاكهة', 'خضروات', 'متجر', 'تسوق أونلاين'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
