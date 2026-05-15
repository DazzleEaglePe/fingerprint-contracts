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
        w-[300px] bg-[#040f0a] border-r border-[#0c2e1f]/50 flex flex-col h-screen
        transition-transform duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.5)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Subtle Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        {/* Subtle Side Glow */}
        <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent" />

        {/* Brand (Desktop only) */}
        <div className="h-24 hidden md:flex items-center gap-3 px-8 border-b border-white/5 relative overflow-hidden">
          <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[200%] bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none mix-blend-screen" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-900 flex items-center justify-center shadow-lg relative z-10 border border-emerald-400/30">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col relative z-10">
            <span className="font-semibold text-xl text-white tracking-wide leading-tight">DecData</span>
            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-medium">Enterprise</span>
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 relative z-10">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border-l-2 border-emerald-400 text-emerald-300 font-medium shadow-[inset_2px_0_0_rgba(52,211,153,1)]'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 hover:translate-x-1'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:scale-110 group-hover:text-emerald-500/50'}`} />
              <span className="text-sm tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-6 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-bold text-sm shadow-inner uppercase border border-emerald-400/20">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-white truncate">{user?.full_name}</span>
            <span className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-semibold truncate">{user?.role}</span>
          </div>
        </div>
        
        <button
          onClick={() => {
            setIsOpen(false);
            logout();
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all font-medium text-sm group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Cerrar Sesión
        </button>

        {/* System Version */}
        <div className="mt-6 flex justify-center text-[9px] text-emerald-900/50 uppercase tracking-widest font-semibold pb-2">
          DecData OS • v2.4.1
        </div>
      </div>
    </div>
    </>
  );
}
