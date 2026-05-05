import { NextResponse } from 'next/server';
import { dbReports } from '@/lib/db';

export async function GET() {
  try {
    const [rows]: any = await dbReports.query('SELECT * FROM global_reports ORDER BY report_date DESC LIMIT 1');
    if (rows.length === 0) {
      return NextResponse.json({ success: true, data: { total_sales: 0, total_orders: 0, total_warehouses: 0 } });
    }
    
    // Get all warehouse reports to show chart data
    const [warehouseReports]: any = await dbReports.query('SELECT warehouse_id, SUM(total_sales) as sales, SUM(total_orders) as orders, SUM(inventory_used) as inventory FROM warehouse_reports GROUP BY warehouse_id');
    
    return NextResponse.json({ success: true, data: rows[0], chartData: warehouseReports });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch global reports' }, { status: 500 });
  }
}
