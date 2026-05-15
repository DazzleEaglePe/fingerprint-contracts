'use client';

import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-zinc-950 pt-16 md:pt-0">
        {/* Usamos un contenedor interior para dar efecto de "card" al área de contenido */}
        <div className="min-h-full p-6 md:p-8 lg:p-12">
          <div className="mx-auto max-w-[1600px]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
