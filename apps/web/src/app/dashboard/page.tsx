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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Hola, {user?.full_name?.split(' ')[0] || 'Usuario'} 👋
        </h1>
        <p className="text-zinc-400">
          Aquí tienes un resumen del estado actual de los contratos y fundos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-zinc-500 mt-1">Total acumulado</p>
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
