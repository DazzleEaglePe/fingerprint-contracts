'use client';

import { useQuery } from '@tanstack/react-query';
import { Plus, MapPin, Trees, ActivitySquare } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

interface Fundo {
  id: string;
  name: string;
  legal_name: string;
  region: string;
  total_hectares: number;
  main_crops: string[];
  is_active: boolean;
}

export default function FundosPage() {
  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: fundos, isLoading, isError, refetch } = useQuery<Fundo[]>({
    queryKey: ['fundos'],
    queryFn: async () => {
      const { data } = await api.get('/api/fundos/');
      return data;
    },
  });

  const handleCreateFundo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const payload = {
        name: formData.get('name'),
        legal_name: formData.get('legal_name'),
        region: formData.get('region'),
        total_hectares: parseFloat(formData.get('total_hectares') as string) || 0,
      };
      
      await api.post('/api/fundos/', payload);
      toast.success('Fundo registrado', { description: 'El fundo se ha guardado correctamente.' });
      setIsCreateModalOpen(false);
      refetch();
    } catch (error: any) {
      toast.error('Error', { description: error.response?.data?.detail || 'Ocurrió un error inesperado' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Terrenos y Fundos</h1>
          <p className="text-zinc-400">
            Gestión de áreas de cultivo.
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Fundo
            </Button>
          </DialogTrigger>
            <DialogContent className="bg-zinc-950/95 backdrop-blur-xl border-zinc-800/60 sm:max-w-[450px] p-0 overflow-hidden shadow-2xl shadow-black">
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white">Registrar Nuevo Fundo</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Añade un nuevo terreno de cultivo.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateFundo} className="space-y-5 pt-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nombre del Fundo</Label>
                    <Input id="name" name="name" required placeholder="Ej. Fundo El Paraíso" className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="legal_name" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Razón Social</Label>
                    <Input id="legal_name" name="legal_name" required placeholder="Agrícola S.A.C." className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="region" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Región</Label>
                      <Input id="region" name="region" required placeholder="Ej. Ica" className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="total_hectares" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hectáreas (ha)</Label>
                      <Input id="total_hectares" name="total_hectares" type="number" step="0.01" required className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-zinc-950/80 px-6 py-4 border-t border-zinc-800/60 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} onClick={(e) => { e.preventDefault(); const form = document.querySelector('form'); if(form) form.requestSubmit(); }} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/20 border border-emerald-500/50 h-10 px-6">
                  {isSubmitting ? 'Guardando...' : 'Guardar Fundo'}
                </Button>
              </div>
            </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
             <Card key={i} className="bg-zinc-900/50 border-zinc-800">
             <CardContent className="p-6 space-y-4">
               <Skeleton className="h-6 w-1/3 bg-zinc-800" />
               <Skeleton className="h-20 w-full bg-zinc-800" />
             </CardContent>
           </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-400 rounded-lg">
          No se pudieron cargar los fundos. Verifica la conexión a la API.
        </div>
      ) : fundos?.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg">
          <MapPin className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No hay fundos registrados</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {fundos?.map((fundo) => (
            <Card key={fundo.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
              <CardHeader className="pb-4 border-b border-zinc-800/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-emerald-500">{fundo.name}</CardTitle>
                    <CardDescription className="text-zinc-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {fundo.region || 'Región no especificada'}
                    </CardDescription>
                  </div>
                  <Badge variant={fundo.is_active ? 'default' : 'secondary'} className={fundo.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}>
                     <ActivitySquare className="w-3 h-3 mr-1" />
                     {fundo.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                      <div className="text-zinc-500 text-xs mb-1">Área Total</div>
                      <div className="text-zinc-200 font-medium">{fundo.total_hectares} ha</div>
                   </div>
                   <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                      <div className="text-zinc-500 text-xs mb-1">Razón Social</div>
                      <div className="text-zinc-200 font-medium truncate" title={fundo.legal_name}>{fundo.legal_name || 'No registrada'}</div>
                   </div>
                </div>

                {fundo.main_crops && fundo.main_crops.length > 0 && (
                   <div className="flex items-center gap-2 pt-2">
                     <Trees className="w-4 h-4 text-emerald-500" />
                     <div className="flex gap-2">
                       {fundo.main_crops.map(crop => (
                         <span key={crop} className="text-xs bg-emerald-950/30 text-emerald-300 px-2 py-1 rounded-full border border-emerald-900/50">
                           {crop}
                         </span>
                       ))}
                     </div>
                   </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
