import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { withErrorHandling } from '@/lib/apiError';

export const DELETE = withErrorHandling(async (request, { params }) => {
  const pool = await getPool();
  const { id: patientId, specialtyId } = params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Same lock used when assigning, so a removal and a concurrent assignment
    // to this specialty never interleave and corrupt the queue numbering.
    await client.query('SELECT id FROM specialties WHERE id = $1 FOR UPDATE', [specialtyId]);

    const deleted = await client.query(
      'DELETE FROM patient_specialties WHERE patient_id = $1 AND specialty_id = $2 RETURNING specialty_queue_number',
      [patientId, specialtyId]
    );

    if (deleted.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'هذا التوجيه غير موجود' }, { status: 404 });
    }

    const removedNumber = deleted.rows[0].specialty_queue_number;

    // Close the gap so the remaining patients in this specialty's waiting list
    // stay consecutive starting at 1, instead of leaving a permanent hole.
    await client.query(
      `UPDATE patient_specialties
       SET specialty_queue_number = specialty_queue_number - 1
       WHERE specialty_id = $1 AND specialty_queue_number > $2`,
      [specialtyId, removedNumber]
    );

    await client.query('COMMIT');
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});
