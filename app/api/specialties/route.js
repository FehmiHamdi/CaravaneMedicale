import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const rows = db.prepare('SELECT * FROM specialties ORDER BY name ASC').all();
  return NextResponse.json(rows);
}

export async function POST(request) {
  const body = await request.json();
  const name = body && body.name ? String(body.name).trim() : '';

  if (!name) {
    return NextResponse.json({ error: 'اسم التخصص مطلوب' }, { status: 400 });
  }

  try {
    const info = db.prepare('INSERT INTO specialties (name) VALUES (?)').run(name);
    const row = db.prepare('SELECT * FROM specialties WHERE id = ?').get(info.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'هذا التخصص موجود بالفعل' }, { status: 400 });
  }
}
