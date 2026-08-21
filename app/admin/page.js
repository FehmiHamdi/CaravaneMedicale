'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { exportToExcel, exportElementToPDF } from '@/lib/exportUtils';
import { safeJson } from '@/lib/apiClient';
import PasscodeGate from '@/components/PasscodeGate';

export default function AdminPage() {
  return (
    <PasscodeGate
      storageKey="caravan_admin_ok"
      expectedCode={process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'}
      title="دخول لوحة التحكم"
    >
      <AdminDashboard />
    </PasscodeGate>
  );
}

function AdminDashboard() {
  const [specialties, setSpecialties] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [error, setError] = useState('');

  const tableRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sRes, pRes] = await Promise.all([fetch('/api/specialties'), fetch('/api/patients')]);
      setSpecialties(await safeJson(sRes));
      setPatients(await safeJson(pRes));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addSpecialty(e) {
    e.preventDefault();
    if (!newSpecialty.trim()) return;
    const res = await fetch('/api/specialties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSpecialty.trim() }),
    });
    if (res.ok) {
      setNewSpecialty('');
      load();
    }
  }

  async function saveEdit(id) {
    if (!editValue.trim()) return;
    await fetch(`/api/specialties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editValue.trim() }),
    });
    setEditing(null);
    load();
  }

  async function deleteSpecialty(id) {
    if (!confirm('هل أنت متأكد من حذف هذا التخصص؟ سيتم إلغاء توجيه المرضى المسندين إليه.')) return;
    await fetch(`/api/specialties/${id}`, { method: 'DELETE' });
    load();
  }

  async function deletePatient(id) {
    if (!confirm('هل أنت متأكد من حذف سجل هذا المريض؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setError('');
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await safeJson(res).catch(() => ({}));
        setError(data.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (err) {
      setError(err.message);
    }
    load();
  }

  async function deleteAllPatients() {
    if (
      !confirm(
        'هل أنت متأكد من حذف جميع سجلات المرضى؟ سيتم حذف كل المرضى وتوجيهاتهم، وستبدأ أرقام التسجيل من جديد. لا يمكن التراجع عن هذا الإجراء.'
      )
    )
      return;
    setError('');
    try {
      const res = await fetch('/api/patients', { method: 'DELETE' });
      if (!res.ok) {
        const data = await safeJson(res).catch(() => ({}));
        setError(data.error || 'حدث خطأ أثناء حذف جميع السجلات');
      }
    } catch (err) {
      setError(err.message);
    }
    load();
  }

  const filteredPatients = filterSpecialty
    ? patients.filter((p) => p.specialties.some((s) => String(s.specialty_id) === filterSpecialty))
    : patients;

  const reportTitle = filterSpecialty
    ? `مرضى تخصص - ${specialties.find((s) => String(s.id) === filterSpecialty)?.name || ''}`
    : 'كل المرضى المسجلين';

  const columns = filterSpecialty
    ? [
        { key: 'specialty_queue_number', header: 'الرقم في التخصص' },
        { key: 'registration_number', header: 'رقم التسجيل' },
        { key: 'first_name', header: 'الاسم الأول' },
        { key: 'last_name', header: 'اللقب' },
        { key: 'age', header: 'العمر' },
        { key: 'phone', header: 'الهاتف' },
        { key: 'address', header: 'العنوان' },
      ]
    : [
        { key: 'registration_number', header: 'رقم التسجيل' },
        { key: 'first_name', header: 'الاسم الأول' },
        { key: 'last_name', header: 'اللقب' },
        { key: 'age', header: 'العمر' },
        { key: 'phone', header: 'الهاتف' },
        { key: 'address', header: 'العنوان' },
        { key: 'specialties_list', header: 'التخصصات' },
      ];

  let rowsForExport = filteredPatients.map((p) => {
    if (filterSpecialty) {
      const match = p.specialties.find((s) => String(s.specialty_id) === filterSpecialty);
      return { ...p, specialty_queue_number: match ? match.specialty_queue_number : '-' };
    }
    return {
      ...p,
      specialties_list: p.specialties.length ? p.specialties.map((s) => s.specialty_name).join('، ') : '-',
    };
  });

  if (filterSpecialty) {
    rowsForExport = [...rowsForExport].sort((a, b) => a.specialty_queue_number - b.specialty_queue_number);
  }

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-red-700">لوحة التحكم</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-red-600">
          → الرئيسية
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-3 mb-4">{error}</div>
      )}

      <section className="mb-10">
        <h2 className="text-lg font-bold mb-3">إدارة التخصصات الطبية</h2>
        <form onSubmit={addSpecialty} className="flex gap-2 mb-4">
          <input
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            className="input"
            placeholder="اسم تخصص جديد"
          />
          <button className="bg-red-600 text-white px-5 rounded-xl font-bold whitespace-nowrap">إضافة</button>
        </form>
        <div className="bg-white rounded-2xl shadow divide-y">
          {specialties.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 gap-3">
              {editing === s.id ? (
                <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="input flex-1" />
              ) : (
                <span className="font-medium">{s.name}</span>
              )}
              <div className="flex gap-2 shrink-0">
                {editing === s.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(s.id)}
                      className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg"
                    >
                      حفظ
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-lg"
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditing(s.id);
                        setEditValue(s.name);
                      }}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => deleteSpecialty(s.id)}
                      className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-lg"
                    >
                      حذف
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {specialties.length === 0 && <p className="p-4 text-gray-400 text-center">لا توجد تخصصات بعد</p>}
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">إدارة المرضى ({patients.length})</h2>
          <button
            onClick={deleteAllPatients}
            disabled={patients.length === 0}
            className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-40"
          >
            حذف الكل
          </button>
        </div>
        {patients.length === 0 ? (
          <p className="text-gray-400 bg-white rounded-xl p-6 text-center">لا يوجد مرضى مسجلون</p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="p-3">رقم التسجيل</th>
                  <th className="p-3">الاسم الكامل</th>
                  <th className="p-3">العمر</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">التخصصات</th>
                  <th className="p-3">حذف</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-bold">{p.registration_number}</td>
                    <td className="p-3">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="p-3">{p.age ?? '-'}</td>
                    <td className="p-3">{p.phone || '-'}</td>
                    <td className="p-3">
                      {p.specialties.length ? p.specialties.map((s) => s.specialty_name).join('، ') : '-'}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => deletePatient(p.id)}
                        className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200"
                      >
                        حذف
                      </button>
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
          <h2 className="text-lg font-bold">التقارير والتصدير</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="input w-56"
            >
              <option value="">كل المرضى</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => exportToExcel(rowsForExport, columns, reportTitle)}
              className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
            >
              تصدير Excel
            </button>
            <button
              onClick={() => exportElementToPDF(tableRef.current, reportTitle)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
            >
              تصدير PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-x-auto p-2">
          <div ref={tableRef} className="p-4">
            <h3 className="text-center font-bold text-lg mb-3">{reportTitle}</h3>
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="p-2 border">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowsForExport.map((p) => (
                  <tr key={p.id}>
                    {columns.map((c) => (
                      <td key={c.key} className="p-2 border">
                        {p[c.key] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rowsForExport.length === 0 && <p className="text-center text-gray-400 p-6">لا توجد بيانات</p>}
          </div>
        </div>
        {loading && <p className="text-gray-400 mt-2">...جارٍ التحميل</p>}
      </section>
    </main>
  );
}
