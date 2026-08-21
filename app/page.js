import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-10 bg-gradient-to-b from-red-50 to-white">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-black text-red-700 mb-2">القافلة الطبية</h1>
        <p className="text-gray-500">الهلال الأحمر - نظام إدارة المرضى</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <NavCard href="/welcome" title="مكتب الاستقبال" desc="تسجيل المرضى الجدد" icon="📝" />
        <NavCard href="/medical" title="المكتب الطبي" desc="توجيه المرضى إلى التخصصات" icon="🩺" />
        <NavCard href="/admin" title="لوحة التحكم" desc="إدارة التخصصات والتقارير" icon="⚙️" />
      </div>
    </main>
  );
}

function NavCard({ href, title, desc, icon }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-8 text-center border border-gray-100 hover:border-red-300"
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <p className="text-gray-500 text-sm">{desc}</p>
    </Link>
  );
}
