import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const specialtyId = searchParams.get('specialty_id');
  const status = searchParams.get('status');

  let query = `
    SELECT p.*, s.name as specialty_name
    FROM patients p
    LEFT JOIN specialties s ON p.specialty_id = s.id
    WHERE 1=1
  `;
  const params = [];
  if (specialtyId) {
    query += ' AND p.specialty_id = ?';
    params.push(specialtyId);
  }
  if (status) {
    query += ' AND p.status = ?';
    params.push(status);
  }
  query += ' ORDER BY p.queue_number ASC';

  const rows = db.prepare(query).all(...params);
  return NextResponse.json(rows);
}

export async function POST(request) {
  const body = await request.json();
  const { first_name, last_name, age, phone, address } = body || {};

  if (!first_name || !first_name.trim() || !last_name || !last_name.trim()) {
    return NextResponse.json({ error: 'الاسم الأول واللقب مطلوبان' }, { status: 400 });
  }

  const maxRow = db.prepare('SELECT COALESCE(MAX(queue_number), 0) as maxq FROM patients').get();
  const queue_number = maxRow.maxq + 1;

  const info = db
    .prepare(
      `INSERT INTO patients (queue_number, first_name, last_name, age, phone, address, status)
       VALUES (?, ?, ?, ?, ?, ?, 'registered')`
    )
    .run(
      queue_number,
      first_name.trim(),
      last_name.trim(),
      age ? Number(age) : null,
      phone ? String(phone).trim() : null,
      address ? String(address).trim() : null
    );

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(patient, { status: 201 });
}
