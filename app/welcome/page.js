'use client';

import { useState } from 'react';
import Link from 'next/link';
import { safeJson } from '@/lib/apiClient';

const EMPTY_FORM = { first_name: '', last_name: '', age: '', phone: '', address: '' };

export default function WelcomePage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [lastPatient, setLastPatient] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('الرجاء إدخال الاسم الأول واللقب');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: form.age ? Number(form.age) : null }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء التسجيل');
      setLastPatient(data);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-red-700">مكتب الاستقبال - تسجيل مريض جديد</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-red-600">
          → الرئيسية
        </Link>
      </div>

      {lastPatient && (
        <div className="bg-green-50 border border-green-300 text-green-800 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm mb-1">تم تسجيل المريض بنجاح</p>
          <p className="text-4xl font-black">رقم التسجيل: {lastPatient.registration_number}</p>
          <p className="mt-1 font-medium">
            {lastPatient.first_name} {lastPatient.last_name}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-4">
        <Field label="الاسم الأول *">
          <input
            required
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="input"
            placeholder="مثال: محمد"
          />
        </Field>
        <Field label="اللقب *">
          <input
            required
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="input"
            placeholder="مثال: بن علي"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="العمر">
            <input
              type="number"
              min="0"
              max="120"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="رقم الهاتف">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
              placeholder="05********"
            />
          </Field>
        </div>
        <Field label="العنوان">
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="input"
            rows={2}
          />
        </Field>
        <button
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
        >
          {loading ? 'جارٍ التسجيل...' : 'تسجيل المريض'}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
