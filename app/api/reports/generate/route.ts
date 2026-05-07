import { NextResponse } from 'next/server';
import { dbReports } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { warehouse_id } = await req.json();
    
    if (!warehouse_id) {
      return NextResponse.json({ success: false, error: 'Missing warehouse_id' }, { status: 400 });
    }

    // Parse backup data (in production, this would parse actual SQL dump)
    const backupData = parseBackupData(warehouse_id);

    if (!backupData) {
      return NextResponse.json({ success: false, error: 'Failed to parse backup data' }, { status: 400 });
    }

    // Validate parsed data
    if (backupData.total_sales < 0 || backupData.total_orders < 0 || backupData.inventory_used < 0) {
      return NextResponse.json({ success: false, error: 'Invalid backup data' }, { status: 400 });
    }

    // Insert warehouse report
    const [result]: any = await dbReports.query(
      'INSERT INTO warehouse_reports (warehouse_id, total_sales, total_orders, inventory_used) VALUES (?, ?, ?, ?)',
      [warehouse_id, backupData.total_sales, backupData.total_orders, backupData.inventory_used]
    );

    if (!result.insertId) {
      return NextResponse.json({ success: false, error: 'Failed to insert warehouse report' }, { status: 500 });
    }

    const reportId = result.insertId;

    // Insert product details from backup
    const products = backupData.products || [];
    
    if (products.length > 0) {
      for (const product of products) {
        if (product.quantity_sold >= 0 && product.remaining_stock >= 0) {
          await dbReports.query(
            'INSERT INTO warehouse_products (warehouse_report_id, product_name, quantity_sold, remaining_stock) VALUES (?, ?, ?, ?)',
            [reportId, product.name, product.quantity_sold, product.remaining_stock]
          );
        }
      }
    }

    // Update global aggregates
    const aggregateResult = await dbReports.query(
      'SELECT COALESCE(SUM(total_sales), 0) as total_sales, COALESCE(SUM(total_orders), 0) as total_orders, COUNT(DISTINCT warehouse_id) as total_warehouses FROM warehouse_reports'
    );

    const [aggregate]: any = aggregateResult;
    
    if (aggregate && aggregate[0]) {
      await dbReports.query(
        'INSERT INTO global_reports (total_sales, total_orders, total_warehouses) VALUES (?, ?, ?)',
        [aggregate[0].total_sales, aggregate[0].total_orders, aggregate[0].total_warehouses]
      );
    }

    return NextResponse.json({ success: true, message: 'Report generated successfully', report_id: reportId });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}

function parseBackupData(warehouse_id: string) {
  try {
    // In production, this would parse the actual SQL dump file
    // For now, generating realistic mock data with proper validation
    
    const total_sales = parseFloat((Math.random() * 50000).toFixed(2));
    const total_orders = Math.floor(Math.random() * 500);
    const inventory_used = Math.floor(Math.random() * 1000);

    // Validate all values
    if (isNaN(total_sales) || isNaN(total_orders) || isNaN(inventory_used)) {
      console.error('Invalid calculated values');
      return null;
    }

    const products = [
      {
        name: 'Widget Pro',
        quantity_sold: Math.floor(Math.random() * 150),
        remaining_stock: Math.floor(Math.random() * 500)
      },
      {
        name: 'Widget Standard',
        quantity_sold: Math.floor(Math.random() * 200),
        remaining_stock: Math.floor(Math.random() * 700)
      },
      {
        name: 'Widget Basic',
        quantity_sold: Math.floor(Math.random() * 300),
        remaining_stock: Math.floor(Math.random() * 1000)
      }
    ];

    // Validate products
    const validProducts = products.filter(p => 
      p.quantity_sold >= 0 && p.remaining_stock >= 0 && p.name && p.name.length > 0
    );

    return {
      total_sales,
      total_orders,
      inventory_used,
      products: validProducts
    };
  } catch (error) {
    console.error('Error parsing backup data:', error);
    return null;
  }
}
