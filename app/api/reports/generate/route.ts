import { NextResponse } from 'next/server';
import { dbReports } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { warehouse_id } = await req.json();
    
    // Mocking the data parsing from SQL dump
    const total_sales = (Math.random() * 10000).toFixed(2);
    const total_orders = Math.floor(Math.random() * 100);
    const inventory_used = Math.floor(Math.random() * 500);
    
    // Insert warehouse report
    const [result]: any = await dbReports.query(
      'INSERT INTO warehouse_reports (warehouse_id, total_sales, total_orders, inventory_used) VALUES (?, ?, ?, ?)',
      [warehouse_id, total_sales, total_orders, inventory_used]
    );

    // Insert mock products
    await dbReports.query(
      'INSERT INTO warehouse_products (warehouse_report_id, product_name, quantity_sold, remaining_stock) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
      [result.insertId, 'Widget A', Math.floor(Math.random()*50), Math.floor(Math.random()*100), result.insertId, 'Widget B', Math.floor(Math.random()*50), Math.floor(Math.random()*100)]
    );

    // Update global report
    await dbReports.query(
      'INSERT INTO global_reports (total_sales, total_orders, total_warehouses) SELECT SUM(total_sales), SUM(total_orders), COUNT(DISTINCT warehouse_id) FROM warehouse_reports'
    );

    return NextResponse.json({ success: true, message: 'Report generated successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
