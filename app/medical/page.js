'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { safeJson } from '@/lib/apiClient';

export default function MedicalPage() {
  const [patients, setPatients] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState({});
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, sRes] = await Promise.all([fetch('/api/patients'), fetch('/api/specialties')]);
      setPatients(await safeJson(pRes));
      setSpecialties(await safeJson(sRes));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function assign(patientId, specialtyId) {
    if (!specialtyId) return;
    setError('');
    setAssigning((a) => ({ ...a, [patientId]: true }));
    try {
      const res = await fetch(`/api/patients/${patientId}/specialties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialty_id: Number(specialtyId) }),
      });
      if (!res.ok) {
        const data = await safeJson(res).catch(() => ({}));
        setError(data.error || 'حدث خطأ أثناء التوجيه');
      }
    } catch (err) {
      setError(err.message);
    }
    await load();
    setAssigning((a) => ({ ...a, [patientId]: false }));
  }

  const specialtyWaitingList = filterSpecialty
    ? patients
        .filter((p) => p.specialties.some((s) => String(s.specialty_id) === filterSpecialty))
        .map((p) => ({
          ...p,
          specialty_queue_number: p.specialties.find((s) => String(s.specialty_id) === filterSpecialty)
            .specialty_queue_number,
        }))
        .sort((a, b) => a.specialty_queue_number - b.specialty_queue_number)
    : [];

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-red-700">المكتب الطبي - التوجيه والفرز</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-red-600">
          → الرئيسية
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-3 mb-4">{error}</div>
      )}

      <section className="mb-10">
        <h2 className="text-lg font-bold mb-3">توجيه المرضى إلى التخصصات ({patients.length})</h2>
        {loading ? (
          <p className="text-gray-400">...جارٍ التحميل</p>
        ) : patients.length === 0 ? (
          <p className="text-gray-400 bg-white rounded-xl p-6 text-center">لا يوجد مرضى مسجلون بعد</p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="p-3">رقم التسجيل</th>
                  <th className="p-3">الاسم الكامل</th>
                  <th className="p-3">العمر</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">التخصصات الحالية</th>
                  <th className="p-3">إضافة تخصص</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => {
                  const assignedIds = new Set(p.specialties.map((s) => s.specialty_id));
                  const available = specialties.filter((s) => !assignedIds.has(s.id));
                  return (
                    <tr key={p.id} className="border-t align-top">
                      <td className="p-3 font-bold">{p.registration_number}</td>
                      <td className="p-3">
                        {p.first_name} {p.last_name}
                      </td>
                      <td className="p-3">{p.age ?? '-'}</td>
                      <td className="p-3">{p.phone || '-'}</td>
                      <td className="p-3">
                        {p.specialties.length === 0 ? (
                          <span className="text-gray-400 text-sm">لم يُوجَّه بعد</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {p.specialties.map((s) => (
                              <span
                                key={s.specialty_id}
                                className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded-lg whitespace-nowrap"
                              >
                                {s.specialty_name} (#{s.specialty_queue_number})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {available.length === 0 ? (
                          <span className="text-gray-400 text-sm">تم التوجيه لجميع التخصصات</span>
                        ) : (
                          <select
                            disabled={assigning[p.id]}
                            value=""
                            onChange={(e) => assign(p.id, e.target.value)}
                            className="input"
                          >
                            <option value="" disabled>
                              اختر التخصص
                            </option>
                            {available.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
            <option value="">اختر تخصصاً لعرض قائمة الانتظار</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {!filterSpecialty ? (
          <p className="text-gray-400 bg-white rounded-xl p-6 text-center">
            اختر تخصصاً لعرض قائمة الانتظار الخاصة به
          </p>
        ) : specialtyWaitingList.length === 0 ? (
          <p className="text-gray-400 bg-white rounded-xl p-6 text-center">لا يوجد مرضى في قائمة الانتظار</p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="p-3">الرقم في التخصص</th>
                  <th className="p-3">رقم التسجيل</th>
                  <th className="p-3">الاسم الكامل</th>
                </tr>
              </thead>
              <tbody>
                {specialtyWaitingList.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-bold">{p.specialty_queue_number}</td>
                    <td className="p-3">{p.registration_number}</td>
                    <td className="p-3">
                      {p.first_name} {p.last_name}
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
