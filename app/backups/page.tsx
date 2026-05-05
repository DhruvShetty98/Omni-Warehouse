"use client";

import { useState, useEffect } from 'react';
import { DatabaseBackup, Download, RotateCcw } from 'lucide-react';

export default function BackupsPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBackups();
    const interval = setInterval(fetchBackups, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      const data = await res.json();
      if (data.success) {
        setBackups(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backup_id: number, warehouse_id: string) => {
    if (!confirm('Are you sure you want to restore this backup? Current data may be lost.')) return;
    try {
      await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup_id, warehouse_id })
      });
      alert('Restore process triggered');
    } catch (err) {
      console.error(err);
      alert('Failed to trigger restore');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <DatabaseBackup className="w-6 h-6 text-blue-600" />
          System Backups
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">Warehouse</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Size (MB)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading backups...</td></tr>
            ) : backups.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No backups found. Go to a warehouse detail page to create one.</td></tr>
            ) : (
              backups.map(backup => (
                <tr key={backup.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{backup.warehouse_name || backup.warehouse_id}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(backup.backup_date).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">{backup.size_mb} MB</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      backup.status === 'Completed' ? 'text-green-600 bg-green-50 border-green-200' :
                      backup.status === 'Failed' ? 'text-red-600 bg-red-50 border-red-200' :
                      'text-blue-600 bg-blue-50 border-blue-200'
                    }`}>
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center justify-end gap-3">
                    <button 
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors" 
                      title="Download SQL Dump"
                      disabled={backup.status !== 'Completed'}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleRestore(backup.id, backup.warehouse_id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                      title="Restore Backup"
                      disabled={backup.status !== 'Completed'}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
