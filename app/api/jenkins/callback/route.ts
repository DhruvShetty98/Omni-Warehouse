import { NextResponse } from 'next/server';
import { dbMgmt } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { warehouse_name, status, api_status, db_status } = await req.json();

    if (!warehouse_name || !status) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    if (status === 'Deleted') {
       await dbMgmt.query('DELETE FROM warehouses WHERE name = ?', [warehouse_name]);
    } else {
       await dbMgmt.query(
         'UPDATE warehouses SET status = ?, api_status = ?, db_status = ? WHERE name = ?',
         [status, api_status, db_status, warehouse_name]
       );
    }

    return NextResponse.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
  }
}
