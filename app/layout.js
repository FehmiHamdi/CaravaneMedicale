import './globals.css';

export const metadata = {
  title: 'القافلة الطبية - الهلال الأحمر',
  description: 'نظام إدارة القافلة الطبية',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-arabic bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
