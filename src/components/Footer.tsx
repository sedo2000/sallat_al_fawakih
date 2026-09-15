'use client';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">سلة الفاكهة</h3>
            <p className="text-gray-400">متجر الفاكهة والخضروات الطازة بأفضل الأسعار</p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">الروابط</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-green-400">من نحن</a></li>
              <li><a href="#" className="hover:text-green-400">اتصل بنا</a></li>
              <li><a href="#" className="hover:text-green-400">الشروط والأحكام</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">تابعنا</h4>
            <div className="flex gap-4 text-gray-400">
              <a href="#" className="hover:text-green-400">Facebook</a>
              <a href="#" className="hover:text-green-400">Instagram</a>
              <a href="#" className="hover:text-green-400">WhatsApp</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2026 سلة الفاكهة. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
