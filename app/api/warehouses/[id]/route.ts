import { NextResponse } from 'next/server';
import { dbMgmt } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [rows]: any = await dbMgmt.query('SELECT * FROM warehouses WHERE id = ?', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch warehouse' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Get warehouse
    const [rows]: any = await dbMgmt.query('SELECT * FROM warehouses WHERE id = ?', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const warehouse = rows[0];

    // Update status to deleting
    await dbMgmt.query('UPDATE warehouses SET status = "Deleting" WHERE id = ?', [id]);

    // Trigger Jenkins to run terraform destroy
    fetch(`http://localhost:3000/api/jenkins/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warehouse_id: id, warehouse_name: warehouse.name })
    }).catch(console.error); // Fire and forget

    return NextResponse.json({ success: true, message: 'Warehouse deletion started' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to delete warehouse' }, { status: 500 });
  }
}
