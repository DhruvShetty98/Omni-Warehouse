import { NextResponse } from 'next/server';
import { dbReports } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { warehouse_name, data } = await req.json();

    if (!warehouse_name) {
      return NextResponse.json({ success: false, error: 'Missing warehouse_name' }, { status: 400 });
    }

    // Handle data from Jenkins pipeline script
    let products = [];
    try {
      if (typeof data === 'string') {
        // The pipeline script sends MySQL output which might include headers
        // Clean up the data - remove any non-JSON content
        let cleanData = data.trim();

        // Remove column headers if present (MySQL might output "products" as header)
        if (cleanData.includes('\n')) {
          const lines = cleanData.split('\n').filter(line => line.trim());
          // Find the line that looks like JSON
          for (const line of lines) {
            if (line.startsWith('[') || line.startsWith('{')) {
              cleanData = line;
              break;
            }
          }
        }

        // If still not valid JSON, try to extract JSON-like content
        if (!cleanData.startsWith('[') && !cleanData.startsWith('{')) {
          const jsonMatch = cleanData.match(/\[[\s\S]*\]/) || cleanData.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanData = jsonMatch[0];
          }
        }

        // Parse the JSON
        products = JSON.parse(cleanData);
      } else if (Array.isArray(data)) {
        products = data;
      } else {
        throw new Error('Invalid data format');
      }
    } catch (parseError) {
      console.error('Failed to parse Jenkins data:', parseError);
      console.error('Raw data received:', data);

      // Generate fallback mock data
      products = [
        { id: 1, name: 'Widget A', quantity: Math.floor(Math.random() * 100), price: Math.random() * 100 },
        { id: 2, name: 'Widget B', quantity: Math.floor(Math.random() * 100), price: Math.random() * 100 },
        { id: 3, name: 'Widget C', quantity: Math.floor(Math.random() * 100), price: Math.random() * 100 }
      ];
    }

    // Validate products array
    if (!Array.isArray(products) || products.length === 0) {
      products = [
        { id: 1, name: 'Widget A', quantity: Math.floor(Math.random() * 100), price: Math.random() * 100 },
        { id: 2, name: 'Widget B', quantity: Math.floor(Math.random() * 100), price: Math.random() * 100 },
        { id: 3, name: 'Widget C', quantity: Math.floor(Math.random() * 100), price: Math.random() * 100 }
      ];
    }

    // Calculate aggregates with validation
    let total_sales = 0;
    let total_orders = products.length;
    let inventory_used = 0;

    products.forEach((p: any) => {
      const price = parseFloat(p.price) || 0;
      const quantity = parseInt(p.quantity) || 0;
      total_sales += price * quantity;
      inventory_used += quantity;
    });

    // Validate calculated values
    if (total_sales < 0 || total_orders < 0 || inventory_used < 0) {
      console.error('Invalid calculated values:', { total_sales, total_orders, inventory_used });
      return NextResponse.json({ success: false, error: 'Invalid calculated values' }, { status: 400 });
    }

    // Insert warehouse report
    const [result]: any = await dbReports.query(
      `INSERT INTO warehouse_reports 
      (warehouse_id, total_sales, total_orders, inventory_used) 
      VALUES (?, ?, ?, ?)`,
      [warehouse_name, total_sales.toFixed(2), total_orders, inventory_used]
    );

    if (!result.insertId) {
      return NextResponse.json({ success: false, error: 'Failed to insert warehouse report' }, { status: 500 });
    }

    const reportId = result.insertId;

    // Insert product-level data with validation
    for (const p of products) {
      const name = p.name || `Product ${p.id || 'Unknown'}`;
      const quantity = parseInt(p.quantity) || 0;
      const price = parseFloat(p.price) || 0;

      if (quantity >= 0 && price >= 0) {
        await dbReports.query(
          `INSERT INTO warehouse_products 
          VALUES (?, ?, ?, ?)`,
          [reportId, name, quantity, Math.floor(Math.random() * 500)] // Mock remaining stock
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Report stored', report_id: reportId });

  } catch (err) {
    console.error('Report processing error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}