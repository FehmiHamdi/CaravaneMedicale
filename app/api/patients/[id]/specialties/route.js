import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request, { params }) {
  const pool = await getPool();
  const body = await request.json();
  const specialtyId = body && body.specialty_id;

  if (!specialtyId) {
    return NextResponse.json({ error: 'التخصص مطلوب' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the specialty row so concurrent assignments to the same specialty
    // serialize instead of racing on the MAX(specialty_queue_number) below.
    const specialtyRes = await client.query('SELECT id FROM specialties WHERE id = $1 FOR UPDATE', [specialtyId]);
    if (specialtyRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'التخصص غير موجود' }, { status: 404 });
    }

    const maxRes = await client.query(
      'SELECT COALESCE(MAX(specialty_queue_number), 0) + 1 AS next FROM patient_specialties WHERE specialty_id = $1',
      [specialtyId]
    );
    const nextQueueNumber = maxRes.rows[0].next;

    const insertRes = await client.query(
      `INSERT INTO patient_specialties (patient_id, specialty_id, specialty_queue_number)
       VALUES ($1, $2, $3)
       ON CONFLICT (patient_id, specialty_id) DO NOTHING
       RETURNING *`,
      [params.id, specialtyId, nextQueueNumber]
    );

    if (insertRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'المريض موجه بالفعل إلى هذا التخصص' }, { status: 409 });
    }

    await client.query('COMMIT');
    return NextResponse.json(insertRes.rows[0], { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'حدث خطأ أثناء التوجيه' }, { status: 500 });
  } finally {
    client.release();
  }
}
