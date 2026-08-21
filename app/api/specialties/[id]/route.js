import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(request, { params }) {
  const body = await request.json();
  const name = body && body.name ? String(body.name).trim() : '';

  if (!name) {
    return NextResponse.json({ error: 'اسم التخصص مطلوب' }, { status: 400 });
  }

  try {
    db.prepare('UPDATE specialties SET name = ? WHERE id = ?').run(name, params.id);
    const row = db.prepare('SELECT * FROM specialties WHERE id = ?').get(params.id);
    return NextResponse.json(row);
  } catch (e) {
    return NextResponse.json({ error: 'هذا التخصص موجود بالفعل' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  db.prepare('UPDATE patients SET specialty_id = NULL WHERE specialty_id = ?').run(params.id);
  db.prepare('DELETE FROM specialties WHERE id = ?').run(params.id);
  return NextResponse.json({ ok: true });
}
