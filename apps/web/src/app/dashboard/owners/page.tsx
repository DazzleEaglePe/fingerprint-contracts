'use client';

import { useQuery } from '@tanstack/react-query';
import { Plus, Fingerprint, UserSquare2, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Interfaz adaptada del backend
interface Fundo {
  id: string;
  name: string;
}

interface Owner {
  id: string;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  email: string;
  phone: string;
  is_biometric_enrolled: boolean;
}

export default function OwnersPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  
  // Fetch owners
  const { data: owners, isLoading, isError, refetch } = useQuery<Owner[]>({
    queryKey: ['owners'],
    queryFn: async () => {
      const { data } = await api.get('/api/owners/');
      return data;
    },
  });

  // Fetch fundos para el dropdown
  const { data: fundos } = useQuery<Fundo[]>({
    queryKey: ['fundos'],
    queryFn: async () => {
      const { data } = await api.get('/api/fundos/');
      return data;
    },
  });

  const handleCreateOwner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const payload = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        document_type: formData.get('document_type'),
        document_number: formData.get('document_number'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        fundo_id: formData.get('fundo_id'),
      };
      
      await api.post('/api/owners/', payload);
      toast.success('Dueño creado', { description: 'El dueño se registró exitosamente.' });
      setIsCreateModalOpen(false);
      refetch(); // Recargar la tabla
    } catch (error: any) {
      toast.error('Error al crear', { description: error.response?.data?.detail || 'Ocurrió un error inesperado' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('ID Copiado', { description: 'Listo para pegar en el escáner biométrico.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Dueños de Fundos</h1>
          <p className="text-zinc-400">
            Directorio de firmantes autorizados.
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Dueño
            </Button>
          </DialogTrigger>
            <DialogContent className="bg-zinc-950/95 backdrop-blur-xl border-zinc-800/60 sm:max-w-[500px] p-0 overflow-hidden shadow-2xl shadow-black">
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">Registrar Nuevo Dueño</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Añade los datos del nuevo firmante. Asegúrate de asignarle un fundo.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOwner} className="space-y-5 pt-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nombres</Label>
                    <Input id="first_name" name="first_name" required className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Apellidos</Label>
                    <Input id="last_name" name="last_name" required className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="document_type" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipo Doc</Label>
                    <select id="document_type" name="document_type" className="flex h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all">
                      <option value="DNI" className="bg-zinc-900">DNI</option>
                      <option value="CE" className="bg-zinc-900">CE</option>
                      <option value="PASAPORTE" className="bg-zinc-900">PASAPORTE</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="document_number" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Número</Label>
                    <Input id="document_number" name="document_number" required className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" required className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Teléfono</Label>
                  <Input id="phone" name="phone" required className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fundo_id" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Asignar Fundo</Label>
                  <select id="fundo_id" name="fundo_id" required className="flex h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all">
                    <option value="" className="bg-zinc-900">Seleccione un fundo...</option>
                    {fundos?.map(f => (
                      <option key={f.id} value={f.id} className="bg-zinc-900">{f.name}</option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            <div className="bg-zinc-950/80 px-6 py-4 border-t border-zinc-800/60 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} onClick={(e) => { e.preventDefault(); const form = document.querySelector('form'); if(form) form.requestSubmit(); }} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/20 border border-emerald-500/50 h-10 px-6">
                {isSubmitting ? 'Guardando...' : 'Guardar Dueño'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-12 w-12 rounded-full bg-zinc-800" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                  <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-400 rounded-lg">
          No se pudieron cargar los dueños. Verifica la conexión a la API.
        </div>
      ) : owners?.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg">
          <UserSquare2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No hay dueños registrados</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {owners?.map((owner) => (
            <Card key={owner.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group overflow-hidden relative">
              {/* Decoración sutil */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 font-bold border border-emerald-800/50">
                      {owner.first_name.charAt(0)}{owner.last_name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-zinc-100">{owner.first_name} {owner.last_name}</CardTitle>
                      <CardDescription className="text-zinc-400 text-xs">
                        {owner.document_type} {owner.document_number}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-zinc-500">Teléfono:</div>
                  <div className="text-zinc-200">{owner.phone || 'N/A'}</div>
                  <div className="text-zinc-500">Correo:</div>
                  <div className="text-zinc-200 truncate" title={owner.email}>{owner.email || 'N/A'}</div>
                </div>

                <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                  <Badge variant="outline" className={owner.is_biometric_enrolled ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-zinc-700 text-zinc-400'}>
                    <Fingerprint className="w-3 h-3 mr-1.5" />
                    {owner.is_biometric_enrolled ? 'Huella Registrada' : 'Sin Huella'}
                  </Badge>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs text-zinc-400 hover:text-white"
                    onClick={() => copyToClipboard(owner.id)}
                  >
                    {copiedId === owner.id ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
