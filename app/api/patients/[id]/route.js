import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { withErrorHandling } from '@/lib/apiError';

export const DELETE = withErrorHandling(async (request, { params }) => {
  const pool = await getPool();
  await pool.query('DELETE FROM patients WHERE id = $1', [params.id]);
  return NextResponse.json({ ok: true });
});
