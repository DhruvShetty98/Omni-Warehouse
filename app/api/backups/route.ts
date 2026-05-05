import { NextResponse } from 'next/server';
import { dbMgmt } from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await dbMgmt.query(`
      SELECT b.*, w.name as warehouse_name 
      FROM backups b 
      LEFT JOIN warehouses w ON b.warehouse_id = w.id 
      ORDER BY b.backup_date DESC
    `);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch backups' }, { status: 500 });
  }
}
