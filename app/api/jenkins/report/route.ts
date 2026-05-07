import { NextResponse } from 'next/server';
import { dbMgmt } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { warehouse_name, data } = await req.json();

    if (!warehouse_name || !data) {
      return NextResponse.json({ success: false, error: 'Missing params' }, { status: 400 });
    }

    const products = JSON.parse(data); // array from Jenkins

    // Calculate aggregates
    let total_sales = 0;
    let total_orders = products.length;
    let inventory_used = 0;

    products.forEach((p: any) => {
      total_sales += (p.price || 0) * (p.quantity || 0);
      inventory_used += p.quantity || 0;
    });

    // Insert warehouse report
    const [result]: any = await dbMgmt.query(
      `INSERT INTO omni_warehouse_reports.warehouse_reports 
      (warehouse_id, total_sales, total_orders, inventory_used) 
      VALUES (?, ?, ?, ?)`,
      [warehouse_name, total_sales, total_orders, inventory_used]
    );

    const reportId = result.insertId;

    // Insert product-level data
    for (const p of products) {
      await dbMgmt.query(
        `INSERT INTO omni_warehouse_reports.warehouse_products 
        (warehouse_report_id, product_name, quantity_sold, remaining_stock)
        VALUES (?, ?, ?, ?)`,
        [reportId, p.name, p.quantity, 0]
      );
    }

    return NextResponse.json({ success: true, message: 'Report stored' });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}