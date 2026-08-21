import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(request, { params }) {
  const id = params.id;
  const body = await request.json();

  const fields = [];
  const values = [];

  if (body.specialty_id !== undefined) {
    fields.push('specialty_id = ?');
    values.push(body.specialty_id);
    if (body.status === undefined) {
      fields.push("status = 'waiting_specialty'");
    }
  }
  if (body.status !== undefined) {
    fields.push('status = ?');
    values.push(body.status);
  }

  if (!fields.length) {
    return NextResponse.json({ error: 'لا يوجد تحديث' }, { status: 400 });
  }

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE patients SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const patient = db
    .prepare(
      `SELECT p.*, s.name as specialty_name FROM patients p
       LEFT JOIN specialties s ON p.specialty_id = s.id
       WHERE p.id = ?`
    )
    .get(id);
  return NextResponse.json(patient);
}

export async function DELETE(request, { params }) {
  db.prepare('DELETE FROM patients WHERE id = ?').run(params.id);
  return NextResponse.json({ ok: true });
}
