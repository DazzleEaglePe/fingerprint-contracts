'use client';

import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

interface Contract {
  id: string;
  code: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  biometric_score: number;
}

export default function ContractsPage() {
  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: contracts, isLoading, refetch } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data } = await api.get('/api/contracts/');
      return data;
    },
  });

  const { data: fundos } = useQuery<any[]>({
    queryKey: ['fundos'],
    queryFn: async () => {
      const { data } = await api.get('/api/fundos/');
      return data;
    },
  });

  const { data: contractTypes } = useQuery<any[]>({
    queryKey: ['contractTypes'],
    queryFn: async () => {
      const { data } = await api.get('/api/contracts/types');
      return data;
    },
  });

  const handleCreateContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const payload = {
        fundo_id: formData.get('fundo_id'),
        contract_type_id: formData.get('contract_type_id'),
        code: formData.get('code'),
        title: formData.get('title'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        amount: parseFloat(formData.get('amount') as string) || 0,
      };
      
      await api.post('/api/contracts/', payload);
      toast.success('Contrato Creado', { description: 'El contrato ahora está en Borrador, pendiente de firma.' });
      setIsCreateModalOpen(false);
      refetch();
    } catch (error: any) {
      toast.error('Error', { description: error.response?.data?.detail || 'Error al crear contrato' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Contratos</h1>
          <p className="text-zinc-400">
            Administración de acuerdos legales y firmas biométricas.
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Contrato
            </Button>
          </DialogTrigger>
            <DialogContent className="bg-zinc-950/95 backdrop-blur-xl border-zinc-800/60 sm:max-w-[500px] p-0 overflow-hidden shadow-2xl shadow-black">
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white">Crear Borrador de Contrato</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Registra un contrato que quedará pendiente de validación biométrica.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateContract} className="space-y-5 pt-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="code" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Código</Label>
                      <Input id="code" name="code" required placeholder="ARR-001" className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="amount" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monto (PEN)</Label>
                      <Input id="amount" name="amount" type="number" required placeholder="5000" className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Título del Contrato</Label>
                    <Input id="title" name="title" required placeholder="Contrato de Arrendamiento" className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="fundo_id" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fundo Relacionado</Label>
                    <select id="fundo_id" name="fundo_id" required className="flex h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all">
                      <option value="" className="bg-zinc-900">Seleccione un fundo...</option>
                      {fundos?.map(f => (
                        <option key={f.id} value={f.id} className="bg-zinc-900">{f.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="contract_type_id" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipo de Contrato</Label>
                    <select id="contract_type_id" name="contract_type_id" required className="flex h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all">
                      <option value="" className="bg-zinc-900">Seleccione el tipo...</option>
                      {contractTypes?.map(ct => (
                        <option key={ct.id} value={ct.id} className="bg-zinc-900">{ct.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="start_date" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fecha Inicio</Label>
                      <Input id="start_date" name="start_date" type="date" required className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg [color-scheme:dark]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="end_date" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fecha Fin</Label>
                      <Input id="end_date" name="end_date" type="date" required className="h-11 bg-zinc-900/50 border-zinc-800 text-white focus:ring-emerald-500/30 focus:border-emerald-500 transition-all rounded-lg [color-scheme:dark]" />
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-zinc-950/80 px-6 py-4 border-t border-zinc-800/60 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} onClick={(e) => { e.preventDefault(); const form = document.querySelector('form'); if(form) form.requestSubmit(); }} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/20 border border-emerald-500/50 h-10 px-6">
                  {isSubmitting ? 'Guardando...' : 'Guardar Borrador'}
                </Button>
              </div>
            </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-emerald-500 animate-pulse">Cargando contratos...</div>
      ) : (
        <div className="grid gap-4">
          {contracts?.map((contract) => (
            <Card key={contract.id} className="bg-zinc-900/50 border-zinc-800 flex flex-col sm:flex-row items-center p-4 gap-6 hover:bg-zinc-900 transition-colors">
              <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-900/50">
                 <FileText className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg text-zinc-100">{contract.title}</h3>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400 bg-zinc-950/50">
                    {contract.code}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-500 flex gap-4">
                   <span>Inicio: {contract.start_date}</span>
                   <span>Fin: {contract.end_date}</span>
                </p>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                 {contract.status === 'PENDING_SIGNATURE' ? (
                   <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10 py-1 px-3">
                     <AlertCircle className="w-3 h-3 mr-1.5" /> Pendiente de Firma
                   </Badge>
                 ) : contract.status === 'ACTIVE' ? (
                   <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 py-1 px-3">
                     <CheckCircle2 className="w-3 h-3 mr-1.5" /> Firmado (Activo)
                   </Badge>
                 ) : (
                   <Badge variant="outline" className="border-zinc-700 text-zinc-400 py-1 px-3">
                     {contract.status}
                   </Badge>
                 )}
                 {contract.biometric_score && (
                   <span className="text-xs text-zinc-500 font-medium">Score Biométrico: {(contract.biometric_score * 100).toFixed(1)}%</span>
                 )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
