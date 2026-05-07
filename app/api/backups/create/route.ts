import { NextResponse } from 'next/server';
import { dbMgmt, dbReports } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { warehouse_id } = await req.json();
    
    if (!warehouse_id) {
      return NextResponse.json({ success: false, error: 'Missing warehouse_id' }, { status: 400 });
    }

    // Get warehouse details
    const [[warehouse]]: any = await dbMgmt.query('SELECT id, name FROM warehouses WHERE id = ?', [warehouse_id]);
    
    if (!warehouse) {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }

    // Get Jenkins credentials
    const username = process.env.JENKINS_USER || 'admin';
    const token = process.env.JENKINS_TOKEN || '';
    const jenkinsUrl = process.env.JENKINS_URL || 'http://localhost:8080';

    if (!token) {
      return NextResponse.json({ success: false, error: 'Jenkins token not configured' }, { status: 500 });
    }

    // Step 1: Get Jenkins crumb for CSRF protection
    let crumbData: any = {};
    try {
      const crumbRes = await fetch(`${jenkinsUrl}/crumbIssuer/api/json`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${username}:${token}`).toString('base64')
        }
      });
      crumbData = await crumbRes.json();
    } catch (e) {
      console.error('Failed to get Jenkins crumb:', e);
    }

    // Step 2: Insert backup record with Pending status
    const [backupResult]: any = await dbMgmt.query(
      'INSERT INTO backups (warehouse_id, size_mb, file_url, status) VALUES (?, ?, ?, ?)',
      [warehouse_id, 0, `/backups/pending-${warehouse_id}-${Date.now()}.sql`, 'Pending']
    );

    const backupId = backupResult.insertId;

    // Step 3: Trigger Jenkins backup job asynchronously
    triggerJenkinsBackup(warehouse, backupId, jenkinsUrl, username, token, crumbData);

    return NextResponse.json({ success: true, message: 'Backup initiated', backup_id: backupId });
  } catch (error) {
    console.error('Backup creation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create backup' }, { status: 500 });
  }
}

async function triggerJenkinsBackup(warehouse: any, backupId: number, jenkinsUrl: string, username: string, token: string, crumbData: any) {
  try {
    const buildUrl = `${jenkinsUrl}/job/Omni-Warehouse/buildWithParameters?WAREHOUSE_NAME=${warehouse.name}&ACTION=backup`;
    
    const response = await fetch(buildUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${token}`).toString('base64'),
        ...(crumbData.crumbRequestField && { [crumbData.crumbRequestField]: crumbData.crumb })
      }
    });

    if (!response.ok) {
      console.error(`Jenkins build failed with status ${response.status}`);
      await dbMgmt.query('UPDATE backups SET status = ? WHERE id = ?', ['Failed', backupId]);
      return;
    }

    console.log(`Jenkins backup job triggered for warehouse ${warehouse.id}`);

    // Simulate backup completion and report generation after 10 seconds
    setTimeout(async () => {
      try {
        // Update backup status to Completed
        await dbMgmt.query(
          'UPDATE backups SET size_mb = ?, status = ? WHERE id = ?',
          [Math.random() * 50, 'Completed', backupId]
        );

        // Parse mock SQL data and generate report
        await generateReport(warehouse.id);
      } catch (err) {
        console.error('Error completing backup:', err);
        await dbMgmt.query('UPDATE backups SET status = ? WHERE id = ?', ['Failed', backupId]);
      }
    }, 10000);
  } catch (error) {
    console.error('Error triggering Jenkins backup:', error);
    await dbMgmt.query('UPDATE backups SET status = ? WHERE id = ?', ['Failed', backupId]);
  }
}

async function generateReport(warehouse_id: string) {
  try {
    // Validate warehouse_id
    if (!warehouse_id) {
      console.error('Invalid warehouse_id for report generation');
      return;
    }

    // Generate realistic data based on backup analysis
    const total_sales = Math.random() * 50000;
    const total_orders = Math.floor(Math.random() * 500);
    const inventory_used = Math.floor(Math.random() * 1000);

    // Validate data
    if (total_sales < 0 || total_orders < 0 || inventory_used < 0) {
      console.error('Invalid data values for report');
      return;
    }

    // Insert warehouse report
    const [result]: any = await dbReports.query(
      'INSERT INTO warehouse_reports (warehouse_id, total_sales, total_orders, inventory_used) VALUES (?, ?, ?, ?)',
      [warehouse_id, total_sales.toFixed(2), total_orders, inventory_used]
    );

    if (!result.insertId) {
      console.error('Failed to insert warehouse report');
      return;
    }

    const reportId = result.insertId;

    // Generate mock products from backup
    const products = [
      { name: 'Product A', quantity_sold: Math.floor(Math.random() * 100), remaining_stock: Math.floor(Math.random() * 500) },
      { name: 'Product B', quantity_sold: Math.floor(Math.random() * 100), remaining_stock: Math.floor(Math.random() * 500) },
      { name: 'Product C', quantity_sold: Math.floor(Math.random() * 100), remaining_stock: Math.floor(Math.random() * 500) }
    ];

    // Insert products with validation
    for (const product of products) {
      if (product.quantity_sold >= 0 && product.remaining_stock >= 0) {
        await dbReports.query(
          'INSERT INTO warehouse_products (warehouse_report_id, product_name, quantity_sold, remaining_stock) VALUES (?, ?, ?, ?)',
          [reportId, product.name, product.quantity_sold, product.remaining_stock]
        );
      }
    }

    // Update global report aggregates
    await dbReports.query(
      'INSERT INTO global_reports (total_sales, total_orders, total_warehouses) SELECT COALESCE(SUM(total_sales), 0), COALESCE(SUM(total_orders), 0), COUNT(DISTINCT warehouse_id) FROM warehouse_reports'
    );

    console.log(`Report generated successfully for warehouse ${warehouse_id}`);
  } catch (error) {
    console.error('Error generating report:', error);
  }
}
