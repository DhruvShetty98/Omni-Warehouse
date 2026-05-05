"use client";

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, Globe } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ReportsPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWhId, setSelectedWhId] = useState<string>('global');
  const [globalData, setGlobalData] = useState<any>(null);
  const [whData, setWhData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
    fetchGlobalData();
  }, []);

  useEffect(() => {
    if (selectedWhId !== 'global') {
      fetchWarehouseData(selectedWhId);
    }
  }, [selectedWhId]);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      if (data.success) {
        setWarehouses(data.data.filter((w: any) => w.status === 'Running'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGlobalData = async () => {
    try {
      const res = await fetch('/api/reports/global');
      const data = await res.json();
      if (data.success) {
        setGlobalData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseData = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/warehouse/${id}`);
      const data = await res.json();
      if (data.success) {
        setWhData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !globalData) return <div className="text-slate-500">Loading reports...</div>;

  const renderGlobalReport = () => {
    if (!globalData) return null;
    const { data, chartData } = globalData;

    const barData = {
      labels: chartData?.map((c: any) => c.warehouse_id) || [],
      datasets: [
        {
          label: 'Total Sales',
          data: chartData?.map((c: any) => parseFloat(c.sales)) || [],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        }
      ]
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" /> Cumulative Global Report
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">Total Global Sales</p>
            <p className="text-2xl font-bold text-slate-800">₹{parseFloat(data.total_sales).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-slate-800">{data.total_orders}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">Total Warehouses Reporting</p>
            <p className="text-2xl font-bold text-slate-800">{data.total_warehouses}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sales per Warehouse</h3>
          <div className="h-72">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    );
  };

  const renderWarehouseReport = () => {
    if (loading) return <div className="text-slate-500 py-8">Loading warehouse data...</div>;
    if (!whData || !whData.data) return <div className="text-slate-500 py-8">No report data found for this warehouse. Wait for a backup to complete.</div>;

    const { data, history, products } = whData;

    const lineData = {
      labels: history.slice(0, 10).reverse().map((h: any) => new Date(h.report_date).toLocaleDateString()),
      datasets: [
        {
          label: 'Sales Trend',
          data: history.slice(0, 10).reverse().map((h: any) => parseFloat(h.total_sales)),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          tension: 0.4
        }
      ]
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800">Individual Warehouse Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">Total Sales</p>
            <p className="text-2xl font-bold text-slate-800 text-green-600">₹{parseFloat(data.total_sales).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-slate-800 text-blue-600">{data.total_orders}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">Inventory Used</p>
            <p className="text-2xl font-bold text-slate-800 text-purple-600">{data.inventory_used}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sales Timeline</h3>
          <div className="h-72">
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-lg font-bold text-slate-800 p-6 border-b">Product Breakdown</h3>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Quantity Sold</th>
                <th className="px-6 py-4">Remaining Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{p.product_name}</td>
                  <td className="px-6 py-4">{p.quantity_sold}</td>
                  <td className="px-6 py-4">{p.remaining_stock}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-500">No product data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Analytics & Reports
        </h1>
        <select 
          className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 bg-white shadow-sm"
          value={selectedWhId}
          onChange={(e) => setSelectedWhId(e.target.value)}
        >
          <option value="global">🌍 Global Cumulative View</option>
          {warehouses.map(wh => (
            <option key={wh.id} value={wh.id}>🏭 {wh.name}</option>
          ))}
        </select>
      </div>

      {selectedWhId === 'global' ? renderGlobalReport() : renderWarehouseReport()}
    </div>
  );
}
