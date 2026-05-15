'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fingerprint, Upload, CheckCircle2, XCircle, ScanFace, FileSignature, Loader2, Activity } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BiometricScannerPage() {
  const [activeTab, setActiveTab] = useState<'enroll' | 'verify'>('verify');
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);
  
  // Fetch owners para el dropdown
  const { data: owners } = useQuery<any[]>({
    queryKey: ['owners'],
    queryFn: async () => {
      const { data } = await api.get('/api/owners/');
      return data;
    },
  });

  // Fetch contracts para el dropdown
  const { data: contracts } = useQuery<any[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data } = await api.get('/api/contracts/');
      return data;
    },
  });

  const [ownerId, setOwnerId] = useState('');
  const [contractId, setContractId] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
    }
  };

  const getErrorMessage = (error: any) => {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
    }
    return detail || error.message;
  };

  // Mutation para Enrollment
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('owner_id', ownerId);
      formData.append('image', file as Blob);
      
      const res = await api.post(`/api/biometric/enroll/${ownerId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Huella registrada correctamente', {
        description: `Se extrajeron ${data.minutiae_count} minutiae (Calidad: ${data.image_quality_score * 100}%)`
      });
      setFile(null);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ['owners'] });
    },
    onError: (error: any) => {
      toast.error('Error en enrolamiento', { description: getErrorMessage(error) });
    }
  });

  // Mutation para Verificación (Firma)
  const verifyMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('owner_id', ownerId);
      formData.append('contract_id', contractId);
      formData.append('image', file as Blob);
      
      const res = await api.post(`/api/biometric/verify/${contractId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.match) {
        toast.success('¡Identidad Verificada!', {
          description: `Score: ${(data.score * 100).toFixed(2)}%. Contrato Firmado.`
        });
        queryClient.invalidateQueries({ queryKey: ['contracts'] });
      } else {
        toast.error('Huella Rechazada', {
          description: `Score: ${(data.score * 100).toFixed(2)}%. No coincide.`
        });
      }
    },
    onError: (error: any) => {
      toast.error('Error en validación', { description: getErrorMessage(error) });
    }
  });

  const isProcessing = enrollMutation.isPending || verifyMutation.isPending;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Motor Biométrico</h1>
        <p className="text-zinc-400">
          Módulo de extracción de minutiae y matching dactilar.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-zinc-900/80 p-1 rounded-lg w-fit border border-zinc-800">
        <button
          onClick={() => setActiveTab('verify')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'verify' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ScanFace className="w-4 h-4" />
          Firma / Validación
        </button>
        <button
          onClick={() => setActiveTab('enroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'enroll' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          Enrolamiento
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Col: Upload & Scan */}
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm relative overflow-hidden">
          {isProcessing && (
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <div className="relative">
                <Fingerprint className="w-24 h-24 text-emerald-500 opacity-20" />
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-scan" />
              </div>
              <p className="mt-6 text-emerald-400 font-medium animate-pulse">Procesando algoritmo Zhang-Suen...</p>
            </div>
          )}

          <CardHeader>
            <CardTitle className="text-zinc-100">Cargar Huella</CardTitle>
            <CardDescription className="text-zinc-400">Sube una imagen .BMP del dataset SOCOFing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Paso 1: Seleccionar Entidad */}
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-emerald-500 mb-2">Paso 1: Seleccionar {activeTab === 'enroll' ? 'Dueño' : 'Contrato'}</h3>
              
              <div className="space-y-2">
                <Label className="text-zinc-300">Dueño Firmante</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                >
                  <option value="">-- Selecciona un dueño --</option>
                  {owners?.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.first_name} {owner.last_name} (DNI: {owner.document_number})
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'verify' && (
                <div className="space-y-2">
                  <Label className="text-zinc-300">Contrato a Firmar</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                  >
                    <option value="">-- Selecciona un contrato --</option>
                    {contracts?.filter(c => {
                      const selectedOwner = owners?.find(o => o.id === ownerId);
                      return !ownerId || c.fundo_id === selectedOwner?.fundo_id;
                    }).map((contract) => (
                      <option key={contract.id} value={contract.id}>
                        {contract.title} - {contract.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Paso 2: Subir Huella */}
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-emerald-500 mb-4">Paso 2: Cargar Huella Dactilar</h3>
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 flex flex-col items-center justify-center relative bg-zinc-950/30 hover:bg-zinc-900/50 transition-colors">
              <input
                type="file"
                accept="image/bmp,image/png,image/jpeg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              {preview ? (
                <img src={preview} alt="Fingerprint" className="h-48 object-contain opacity-80 filter contrast-125 grayscale" />
              ) : (
                <div className="flex flex-col items-center text-zinc-500">
                  <Upload className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-medium text-zinc-300">Haz clic o arrastra la imagen</p>
                  <p className="text-xs mt-1">Soporta BMP, PNG, JPG</p>
                </div>
              )}
            </div>
            </div>
          </CardContent>
          <CardFooter className="bg-zinc-950/80 border-t border-zinc-800/50 p-6">
            <Button 
              className={`w-full h-12 text-base font-semibold shadow-lg transition-all duration-300 ${
                activeTab === 'enroll' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/25 border border-blue-500/50' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/25 border border-emerald-500/50'
              }`}
              disabled={!file || !ownerId || (activeTab === 'verify' && !contractId) || isProcessing}
              onClick={() => activeTab === 'enroll' ? enrollMutation.mutate() : verifyMutation.mutate()}
            >
              {activeTab === 'enroll' ? (
                <><Fingerprint className="w-5 h-5 mr-2 animate-pulse" /> Guardar Huella Maestra</>
              ) : (
                <><FileSignature className="w-5 h-5 mr-2" /> Validar y Firmar</>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Right Col: Academic Info & Results */}
        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Pipeline de Procesamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div><strong className="text-zinc-200">1. Preprocesamiento:</strong> Filtros Gabor direccionales para mejorar la claridad de las crestas dactilares.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div><strong className="text-zinc-200">2. Esqueletización:</strong> Reducción de crestas a 1 pixel usando el algoritmo Zhang-Suen.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div><strong className="text-zinc-200">3. Extracción (Crossing Number):</strong> Identificación de Terminaciones y Bifurcaciones (Minutiae).</div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Results Box */}
          {(verifyMutation.isSuccess || enrollMutation.isSuccess) && (
            <Card className="bg-zinc-950 border-emerald-900/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-500 text-lg">Resultado del Algoritmo</CardTitle>
              </CardHeader>
              <CardContent>
                {verifyMutation.isSuccess && (
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-zinc-800 pb-2">
                      <span className="text-zinc-400">Score de Match:</span>
                      <span className="text-white font-bold">{(verifyMutation.data.score * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800 pb-2">
                      <span className="text-zinc-400">Puntos Coincidentes:</span>
                      <span className="text-white font-bold">{verifyMutation.data?.minutiae_matched} minutiae</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-zinc-400">Veredicto FAR/FRR:</span>
                      {verifyMutation.data?.match ? (
                        <span className="text-emerald-400 font-bold">APROBADO</span>
                      ) : (
                        <span className="text-red-400 font-bold">RECHAZADO</span>
                      )}
                    </div>
                  </div>
                )}
                {enrollMutation.isSuccess && (
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-zinc-800 pb-2">
                      <span className="text-zinc-400">Minutiae Extraídas:</span>
                      <span className="text-white font-bold">{enrollMutation.data.minutiae_count}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-zinc-400">Calidad de Huella:</span>
                      <span className="text-emerald-400 font-bold">{(enrollMutation.data.image_quality_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Añadir clase CSS para la animación del escáner en global o aquí en un tag style */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />
    </div>
  );
}
