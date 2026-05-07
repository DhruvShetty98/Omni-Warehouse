"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Server, Activity, Database, RefreshCw, DatabaseBackup, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouse();
  }, [id]);

  const fetchWarehouse = async () => {
    try {
      const res = await fetch(`/api/warehouses/${id}`);
      const data = await res.json();
      if (data.success) {
        setWarehouse(data.data);
      } else if (res.status === 404) {
        router.push('/warehouses');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      await fetch('/api/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouse_id: id })
      });
      alert('Backup triggered');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestart = async () => {
    try {
      await fetch(`/api/jenkins/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouse_id: id, action: 'restart' })
      });
      alert('Restart triggered');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-slate-500">Loading details...</div>;
  if (!warehouse) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/warehouses" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">{warehouse.name} Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Information</h2>
          <div>
            <p className="text-sm text-slate-500">ID</p>
            <p className="font-mono text-sm">{warehouse.id}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className="font-medium text-slate-800">{warehouse.status}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Created At</p>
            <p className="text-slate-800">{new Date(warehouse.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Services Status</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-md"><Activity className="w-5 h-5" /></div>
              <div>
                <p className="font-medium text-slate-800">API Container</p>
                <p className="text-sm text-slate-500">Docker service</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
              warehouse.api_status === 'running' ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'
            }`}>
              {warehouse.api_status}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-md"><Database className="w-5 h-5" /></div>
              <div>
                <p className="font-medium text-slate-800">Database</p>
                <p className="text-sm text-slate-500">MySQL instance</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
              warehouse.db_status === 'running' ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'
            }`}>
              {warehouse.db_status}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Actions</h2>
          <button 
            onClick={handleBackup}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors w-full"
            disabled={warehouse.status !== 'Running'}
          >
            <DatabaseBackup className="w-4 h-4" />
            Backup Now
          </button>
          <button 
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-4 rounded-md transition-colors w-full"
            disabled={warehouse.status !== 'Running'}
          >
            <RefreshCw className="w-4 h-4" />
            Restart Services
          </button>
        </div>
      </div>
    </div>
  );
}
