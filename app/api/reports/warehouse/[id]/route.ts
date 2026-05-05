import { NextResponse } from 'next/server';
import { dbReports } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [reports]: any = await dbReports.query('SELECT * FROM warehouse_reports WHERE warehouse_id = ? ORDER BY report_date DESC', [id]);
    
    if (reports.length === 0) {
      return NextResponse.json({ success: true, data: null, products: [] });
    }

    const latestReport = reports[0];
    const [products]: any = await dbReports.query('SELECT * FROM warehouse_products WHERE warehouse_report_id = ?', [latestReport.id]);

    return NextResponse.json({ success: true, data: latestReport, history: reports, products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch warehouse reports' }, { status: 500 });
  }
}
