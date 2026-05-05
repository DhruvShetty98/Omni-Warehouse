import { NextResponse } from 'next/server';
import { dbMgmt } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { warehouse_id } = await req.json();
    
    // Simulate Jenkins backup pipeline trigger
    fetch(`http://localhost:3000/api/jenkins/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warehouse_id })
    }).catch(console.error);
    
    // Mock DB record
    await dbMgmt.query(
      'INSERT INTO backups (warehouse_id, size_mb, file_url, status) VALUES (?, ?, ?, ?)',
      [warehouse_id, (Math.random() * 50).toFixed(2), `/backups/mock-${warehouse_id}.sql`, 'Pending']
    );

    // Simulate callback after 5 seconds to set Completed and generate report
    setTimeout(async () => {
       await dbMgmt.query('UPDATE backups SET status = "Completed" WHERE warehouse_id = ? AND status = "Pending"', [warehouse_id]);
       fetch(`http://localhost:3000/api/reports/generate`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ warehouse_id })
       }).catch(console.error);
    }, 5000);

    return NextResponse.json({ success: true, message: 'Backup started' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to create backup' }, { status: 500 });
  }
}
