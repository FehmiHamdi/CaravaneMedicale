'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

export default function MedicalPage() {
  const [patients, setPatients] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, sRes] = await Promise.all([fetch('/api/patients'), fetch('/api/specialties')]);
    setPatients(await pRes.json());
    setSpecialties(await sRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function assign(patientId, specialtyId) {
    if (!specialtyId) return;
    setAssigning((a) => ({ ...a, [patientId]: true }));
    await fetch(`/api/patients/${patientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specialty_id: Number(specialtyId) }),
    });
    await load();
    setAssigning((a) => ({ ...a, [patientId]: false }));
  }

  async function markDone(patientId) {
    await fetch(`/api/patients/${patientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });
    await load();
  }

  const waiting = patients.filter((p) => p.status === 'registered');
  const inSpecialty = patients.filter(
    (p) => p.status === 'waiting_specialty' && (!filterSpecialty || String(p.specialty_id) === filterSpecialty)
  );

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-red-700">المكتب الطبي - التوجيه والفرز</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-red-600">
          → الرئيسية
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-bold mb-3">مرضى بانتظار التوجيه ({waiting.length})</h2>
        {loading ? (
          <p className="text-gray-400">...جارٍ التحميل</p>
        ) : waiting.length === 0 ? (
          <p className="text-gray-400 bg-white rounded-xl p-6 text-center">
            لا يوجد مرضى بانتظار التوجيه حالياً
          </p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="p-3">الطابور</th>
                  <th className="p-3">الاسم الكامل</th>
                  <th className="p-3">العمر</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">توجيه إلى تخصص</th>
                </tr>
              </thead>
              <tbody>
                {waiting.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-bold">{p.queue_number}</td>
                    <td className="p-3">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="p-3">{p.age ?? '-'}</td>
                    <td className="p-3">{p.phone || '-'}</td>
                    <td className="p-3">
                      <select
                        disabled={assigning[p.id]}
                        defaultValue=""
                        onChange={(e) => assign(p.id, e.target.value)}
                        className="input"
                      >
                        <option value="" disabled>
                          اختر التخصص
                        </option>
                        {specialties.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold">قوائم الانتظار حسب التخصص</h2>
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="input w-56"
          >
            <option value="">كل التخصصات</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {inSpecialty.length === 0 ? (
          <p className="text-gray-400 bg-white rounded-xl p-6 text-center">لا يوجد مرضى في قائمة الانتظار</p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="p-3">الطابور</th>
                  <th className="p-3">الاسم الكامل</th>
                  <th className="p-3">التخصص</th>
                  <th className="p-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {inSpecialty.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-bold">{p.queue_number}</td>
                    <td className="p-3">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="p-3">{p.specialty_name}</td>
                    <td className="p-3">
                      <button
                        onClick={() => markDone(p.id)}
                        className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200"
                      >
                        تم الكشف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
