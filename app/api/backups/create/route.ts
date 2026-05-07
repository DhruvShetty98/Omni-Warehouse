import { NextResponse } from 'next/server';
import { dbMgmt, dbReports } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { warehouse_id } = await req.json();

    if (!warehouse_id) {
      return NextResponse.json({ success: false, error: 'Missing warehouse_id' }, { status: 400 });
    }

    // Get warehouse
    const [[warehouse]]: any = await dbMgmt.query(
      'SELECT id, name FROM warehouses WHERE id = ?',
      [warehouse_id]
    );

    if (!warehouse) {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }

    // Jenkins config
    const username = process.env.JENKINS_USER || 'admin';
    const token = process.env.JENKINS_TOKEN || '';
    const jenkinsUrl = process.env.JENKINS_URL || 'http://localhost:8080';

    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing Jenkins token' }, { status: 500 });
    }

    // ✅ Get crumb (FIXED)
    const crumbRes = await fetch(`${jenkinsUrl}/crumbIssuer/api/json`, {
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${username}:${token}`).toString('base64'),
      },
    });

    const crumbData = await crumbRes.json();

    // ✅ Create backup record
    const [backupResult]: any = await dbMgmt.query(
      'INSERT INTO backups (warehouse_id, size_mb, file_url, status) VALUES (?, ?, ?, ?)',
      [warehouse_id, 0, `/backups/pending-${warehouse_id}.sql`, 'Pending']
    );

    const backupId = backupResult.insertId;

    // ✅ Trigger Jenkins
    const buildUrl = `${jenkinsUrl}/job/Omni-Warehouse/buildWithParameters?WAREHOUSE_NAME=${encodeURIComponent(
      warehouse.name
    )}&ACTION=backup`;

    const response = await fetch(buildUrl, {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${username}:${token}`).toString('base64'),
        ...(crumbData.crumbRequestField && {
          [crumbData.crumbRequestField]: crumbData.crumb,
        }),
      },
    });

    if (!response.ok) {
      await dbMgmt.query(
        'UPDATE backups SET status = ? WHERE id = ?',
        ['Failed', backupId]
      );
      return NextResponse.json({ success: false, error: 'Jenkins trigger failed' });
    }

    console.log('Jenkins triggered successfully');

    return NextResponse.json({
      success: true,
      message: 'Backup started',
      backup_id: backupId,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

/////////////////////////////////////////////////////////////
// ✅ CALLBACK API (Jenkins will hit SAME file)
/////////////////////////////////////////////////////////////

export async function PUT(req: Request) {
  try {
    const { warehouse_name, status, data } = await req.json();

    if (!warehouse_name || !status) {
      return NextResponse.json({ success: false, error: 'Missing params' }, { status: 400 });
    }

    // ✅ Update backup status
    await dbMgmt.query(
      'UPDATE backups SET status = ?, size_mb = ? WHERE warehouse_id = (SELECT id FROM warehouses WHERE name = ?)',
      [status, Math.random() * 50, warehouse_name]
    );

    // ❌ If failed → stop
    if (status !== 'Completed') {
      return NextResponse.json({ success: true, message: 'Backup status updated' });
    }

    /////////////////////////////////////////////////////////////
    // ✅ REPORT GENERATION (REAL FLOW)
    /////////////////////////////////////////////////////////////

    const products = JSON.parse(data || '[]');

    let total_sales = 0;
    let total_orders = 0;
    let inventory_used = 0;

    for (const p of products) {
      total_sales += p.price * p.quantity;
      total_orders += p.quantity;
      inventory_used += p.quantity;
    }

    // Insert report
    const [result]: any = await dbReports.query(
      'INSERT INTO warehouse_reports (warehouse_id, total_sales, total_orders, inventory_used) VALUES (?, ?, ?, ?)',
      [warehouse_name, total_sales, total_orders, inventory_used]
    );

    const reportId = result.insertId;

    // Insert products
    for (const p of products) {
      await dbReports.query(
        'INSERT INTO warehouse_products (warehouse_report_id, product_name, quantity_sold, remaining_stock) VALUES (?, ?, ?, ?)',
        [reportId, p.name, p.quantity, p.quantity]
      );
    }

    // Update global report
    await dbReports.query(`
      INSERT INTO global_reports (total_sales, total_orders, total_warehouses)
      SELECT 
        COALESCE(SUM(total_sales),0),
        COALESCE(SUM(total_orders),0),
        COUNT(DISTINCT warehouse_id)
      FROM warehouse_reports
    `);

    return NextResponse.json({ success: true, message: 'Report generated' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Callback failed' }, { status: 500 });
  }
}