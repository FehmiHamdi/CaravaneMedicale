import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const PATIENT_WITH_SPECIALTIES_QUERY = `
  SELECT
    p.*,
    COALESCE(
      json_agg(
        json_build_object(
          'specialty_id', s.id,
          'specialty_name', s.name,
          'specialty_queue_number', ps.specialty_queue_number
        )
        ORDER BY ps.specialty_queue_number
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'
    ) AS specialties
  FROM patients p
  LEFT JOIN patient_specialties ps ON ps.patient_id = p.id
  LEFT JOIN specialties s ON s.id = ps.specialty_id
  GROUP BY p.id
  ORDER BY p.registration_number ASC
`;

export async function GET() {
  const pool = await getPool();
  const { rows } = await pool.query(PATIENT_WITH_SPECIALTIES_QUERY);
  return NextResponse.json(rows);
}

export async function POST(request) {
  const pool = await getPool();
  const body = await request.json();
  const { first_name, last_name, age, phone, address } = body || {};

  if (!first_name || !first_name.trim() || !last_name || !last_name.trim()) {
    return NextResponse.json({ error: 'الاسم الأول واللقب مطلوبان' }, { status: 400 });
  }

  const info = await pool.query(
    `INSERT INTO patients (first_name, last_name, age, phone, address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      first_name.trim(),
      last_name.trim(),
      age ? Number(age) : null,
      phone ? String(phone).trim() : null,
      address ? String(address).trim() : null,
    ]
  );

  const patient = { ...info.rows[0], specialties: [] };
  return NextResponse.json(patient, { status: 201 });
}
