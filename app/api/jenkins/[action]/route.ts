import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  try {
    const body = await req.json();
    const { warehouse_id, warehouse_name } = body;
    
    console.log(`[JENKINS MOCK] Triggering pipeline for action: ${action}, warehouse: ${warehouse_name}`);

    // In a real scenario, we would make a fetch to Jenkins webhook here:
    // await fetch('http://jenkins-server/generic-webhook-trigger/invoke?token=mytoken', { ... })

    // Simulate Jenkins running the job and calling our callback after some time
    if (action === 'create') {
      setTimeout(() => {
        fetch(`http://localhost:8080/job/Omni-Warehouse/buildWithParameters?WAREHOUSE_NAME=${warehouse_name}&ACTION=create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ warehouse_id, status: 'Running', api_status: 'running', db_status: 'running' })
        }).catch(console.error);
      }, 10000); // 10 seconds mock provision time
    } else if (action === 'delete') {
      setTimeout(() => {
        fetch(`http://localhost:8080/job/Omni-Warehouse/buildWithParameters?WAREHOUSE_NAME=${warehouse_name}&ACTION=delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ warehouse_id, status: 'Deleted', api_status: 'stopped', db_status: 'stopped' })
        }).catch(console.error);
      }, 5000);
    }

    return NextResponse.json({ success: true, message: `Jenkins ${action} triggered` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to trigger Jenkins' }, { status: 500 });
  }
}
