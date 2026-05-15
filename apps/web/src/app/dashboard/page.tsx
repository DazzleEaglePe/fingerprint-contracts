'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { FileText, Map, Users, Activity } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: fundos } = useQuery<any[]>({
    queryKey: ['fundos'],
    queryFn: async () => { const { data } = await api.get('/api/fundos/'); return data; },
  });

  const { data: owners } = useQuery<any[]>({
    queryKey: ['owners'],
    queryFn: async () => { const { data } = await api.get('/api/owners/'); return data; },
  });

  const { data: contracts } = useQuery<any[]>({
    queryKey: ['contracts'],
    queryFn: async () => { const { data } = await api.get('/api/contracts/'); return data; },
  });

  const activeContracts = contracts?.filter(c => c.status === 'SIGNED' || c.status === 'ACTIVE').length || 0;
  const pendingContractsList = contracts?.filter(c => c.status === 'PENDING_SIGNATURE' || c.status === 'DRAFT') || [];

  const stats = [
    { title: 'Contratos Firmados', value: activeContracts.toString(), icon: FileText, color: 'text-blue-500' },
    { title: 'Fundos Registrados', value: (fundos?.length || 0).toString(), icon: Map, color: 'text-emerald-500' },
    { title: 'Dueños Registrados', value: (owners?.length || 0).toString(), icon: Users, color: 'text-purple-500' },
    { title: 'Pendientes de Firma', value: pendingContractsList.length.toString(), icon: Activity, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Premium Dashboard Hero */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c2e1f] via-[#082015] to-[#040f0a] p-8 md:p-12 shadow-2xl border border-emerald-900/40">
        <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[150%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="max-w-xl">
            <h2 className="text-emerald-400 text-lg md:text-xl font-medium mb-2 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-emerald-400"></span> Hello {user?.full_name?.split(' ')[0] || 'Admin'}
            </h2>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight mb-4">
              ¿Y si tuvieras control <br />
              <span className="text-emerald-500 font-light">total sobre tus fundos?</span>
            </h1>
            <p className="text-emerald-200/60 text-sm md:text-base leading-relaxed">
              Mediante estrategias inteligentes y financiamiento agrícola, puedes desbloquear un flujo de trabajo más rápido y firmas seguras.
            </p>
          </div>
          
          {/* Main Stat Card / 'Balance' equivalent */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl min-w-[280px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-transform duration-500">
            <p className="text-emerald-200/70 text-sm font-medium mb-1">Total Firmas Aprobadas</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-white tracking-tight">{activeContracts}</span>
              <span className="text-emerald-400 text-sm font-medium flex items-center bg-emerald-400/10 px-2 py-0.5 rounded-full">
                ↑ 100%
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs text-zinc-400">Firmas seguras validadas</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Stats secundarias con diseño premium */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        {[
          { title: 'Fundos Activos', value: (fundos?.length || 0).toString(), icon: Map, color: 'text-emerald-400', bg: 'bg-[#0b1c14]', border: 'border-emerald-900/30' },
          { title: 'Dueños Registrados', value: (owners?.length || 0).toString(), icon: Users, color: 'text-emerald-400', bg: 'bg-[#0b1c14]', border: 'border-emerald-900/30' },
          { title: 'Contratos Pendientes', value: pendingContractsList.length.toString(), icon: FileText, color: 'text-orange-400', bg: 'bg-[#1c120b]', border: 'border-orange-900/30' },
        ].map((stat) => (
          <Card key={stat.title} className={`${stat.bg} ${stat.border} backdrop-blur-md shadow-lg hover:bg-opacity-80 transition-colors`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-light text-white">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Actividad Reciente</CardTitle>
            <CardDescription className="text-zinc-400">
              Últimas validaciones biométricas y contratos firmados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed border-zinc-800">
              <span className="text-zinc-500 text-sm">El gráfico de actividad se renderizará aquí</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Contratos Pendientes</CardTitle>
            <CardDescription className="text-zinc-400">
              Requieren firma biométrica del dueño.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
               {pendingContractsList.length > 0 ? (
                 pendingContractsList.map((contract) => (
                   <div key={contract.id} className="flex items-center gap-4 p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-orange-900/20 flex items-center justify-center text-orange-500">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className="text-sm font-medium leading-none text-zinc-200 truncate">{contract.title}</p>
                        <p className="text-xs text-zinc-500 truncate">{contract.code}</p>
                      </div>
                      <div className="text-xs font-medium text-orange-500 px-2 py-1 rounded-full bg-orange-950/30 whitespace-nowrap">
                        Pendiente
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center text-sm text-zinc-500 py-8">
                   No hay contratos pendientes
                 </div>
               )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
