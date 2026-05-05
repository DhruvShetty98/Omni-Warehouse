"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Server, BarChart3, DatabaseBackup, LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Warehouses', href: '/warehouses', icon: Server },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Backups', href: '/backups', icon: DatabaseBackup },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r min-h-screen">
      <div className="h-16 flex items-center px-6 border-b">
        <h1 className="text-xl font-bold text-slate-800">Omni-Warehouse</h1>
      </div>
      <div className="flex-1 py-6 flex flex-col gap-2 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t">
        <Link 
          href="/login" 
          className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
          onClick={() => { localStorage.removeItem('token'); }}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Link>
      </div>
    </div>
  );
}
