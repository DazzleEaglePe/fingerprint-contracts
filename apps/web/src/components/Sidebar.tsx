'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Map, Users, FileText, Fingerprint, ShieldAlert, LogOut, Leaf, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const menuItems = [
  { name: 'Resumen', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Fundos', href: '/dashboard/fundos', icon: Map },
  { name: 'Dueños', href: '/dashboard/owners', icon: Users },
  { name: 'Contratos', href: '/dashboard/contracts', icon: FileText },
  { name: 'Enrollment Biom.', href: '/dashboard/enrollment', icon: Fingerprint },
  { name: 'Auditoría', href: '/dashboard/audit', icon: ShieldAlert },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800 fixed top-0 w-full z-40">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-emerald-500" />
          <span className="font-bold text-lg text-emerald-50 tracking-tight">DecData</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-300 p-2 focus:outline-none">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen text-zinc-300
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand (Desktop only) */}
        <div className="h-16 hidden md:flex items-center gap-2 px-6 border-b border-zinc-800">
        <Leaf className="w-6 h-6 text-emerald-500" />
        <span className="font-bold text-lg text-emerald-50 tracking-tight">DecData</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-emerald-900/40 text-emerald-400 font-medium'
                  : 'hover:bg-zinc-900 hover:text-zinc-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-zinc-900/50 rounded-md">
          <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-100 font-bold text-xs uppercase">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-white truncate">{user?.full_name}</span>
            <span className="text-xs text-zinc-500 truncate">{user?.role}</span>
          </div>
        </div>
        
        <button
          onClick={() => {
            setIsOpen(false);
            logout();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-red-400 hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
    </>
  );
}
