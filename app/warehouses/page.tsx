"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Trash2, Eye, Server } from 'lucide-react';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [newWhName, setNewWhName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      if (data.success) {
        setWarehouses(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhName) return;
    try {
      await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWhName })
      });
      setNewWhName('');
      fetchWarehouses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;
    try {
      await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
      fetchWarehouses();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Running': return 'text-green-600 bg-green-50 border-green-200';
      case 'Creating': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Server className="w-6 h-6 text-blue-600" />
          Warehouses
        </h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
        <form onSubmit={handleCreate} className="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="text"
            placeholder="Warehouse Name..."
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
            value={newWhName}
            onChange={e => setNewWhName(e.target.value)}
          />
          <button 
            type="submit" 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </form>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : warehouses.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No warehouses found. Create one to get started.</td></tr>
            ) : (
              warehouses.map(wh => (
                <tr key={wh.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{wh.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(wh.status)}`}>
                      {wh.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{new Date(wh.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 flex items-center justify-end gap-3">
                    {wh.status !== 'Deleted' &&
                    <Link href={`/warehouses/${wh.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View Details">
                      <Eye className="w-4 h-4" />
                    </Link>}
                    <button 
                      onClick={() => handleDelete(wh.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                      title="Delete Warehouse"
                      disabled={wh.status === 'Deleting'}
                    >
                      <Trash2 className="w-4 h-4" />
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
