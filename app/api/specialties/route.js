import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  const pool = await getPool();
  const { rows } = await pool.query('SELECT * FROM specialties ORDER BY name ASC');
  return NextResponse.json(rows);
}

export async function POST(request) {
  const pool = await getPool();
  const body = await request.json();
  const name = body && body.name ? String(body.name).trim() : '';

  if (!name) {
    return NextResponse.json({ error: 'اسم التخصص مطلوب' }, { status: 400 });
  }

  try {
    const info = await pool.query('INSERT INTO specialties (name) VALUES ($1) RETURNING *', [name]);
    return NextResponse.json(info.rows[0], { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'هذا التخصص موجود بالفعل' }, { status: 400 });
  }
}
