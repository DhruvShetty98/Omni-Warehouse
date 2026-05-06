import { NextResponse } from 'next/server';
import { dbMgmt } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const [rows] = await dbMgmt.query('SELECT * FROM warehouses ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch warehouses' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ success: false, error: 'Warehouse name is required' }, { status: 400 });
    }

    const id = uuidv4();
    
    // Insert into DB as 'Creating'
    await dbMgmt.query(
      'INSERT INTO warehouses (id, name, status, api_status, db_status) VALUES (?, ?, ?, ?, ?)',
      [id, name, 'Creating', 'unknown', 'unknown']
    );

    

    // Call Jenkins webhook asynchronously
    fetch(`http://localhost:3000/api/jenkins/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warehouse_id: id, warehouse_name: name })
    }).catch(console.error); // Fire and forget

    return NextResponse.json({ success: true, message: 'Warehouse creation started', data: { id, name, status: 'Creating' } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to create warehouse' }, { status: 500 });
  }
}
