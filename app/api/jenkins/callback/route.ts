import { NextResponse } from 'next/server';
import { dbMgmt } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { warehouse_id, status, api_status, db_status } = await req.json();

    if (!warehouse_id || !status) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    if (status === 'Deleted') {
       await dbMgmt.query('DELETE FROM warehouses WHERE id = ?', [warehouse_id]);
    } else {
       await dbMgmt.query(
         'UPDATE warehouses SET status = ?, api_status = ?, db_status = ? WHERE id = ?',
         [status, api_status, db_status, warehouse_id]
       );
    }

    return NextResponse.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
  }
}
