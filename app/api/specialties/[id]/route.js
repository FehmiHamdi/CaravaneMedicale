import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { withErrorHandling } from '@/lib/apiError';

export const PATCH = withErrorHandling(async (request, { params }) => {
  const pool = await getPool();
  const body = await request.json();
  const name = body && body.name ? String(body.name).trim() : '';

  if (!name) {
    return NextResponse.json({ error: 'اسم التخصص مطلوب' }, { status: 400 });
  }

  try {
    const info = await pool.query('UPDATE specialties SET name = $1 WHERE id = $2 RETURNING *', [name, params.id]);
    return NextResponse.json(info.rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return NextResponse.json({ error: 'هذا التخصص موجود بالفعل' }, { status: 400 });
    }
    throw e;
  }
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const pool = await getPool();
  // patient_specialties rows for this specialty cascade-delete automatically (ON DELETE CASCADE).
  await pool.query('DELETE FROM specialties WHERE id = $1', [params.id]);
  return NextResponse.json({ ok: true });
});
