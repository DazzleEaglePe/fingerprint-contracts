'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Fingerprint, Leaf, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email({ message: 'El correo debe ser válido.' }),
  password: z.string().min(6, { message: 'Mínimo 6 caracteres.' }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [isHovering, setIsHovering] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await api.post('/api/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      login(data.user, data.access_token);
      toast.success(`Bienvenido/a, ${data.user.full_name}`);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error de conexión';
      toast.error('Inicio de sesión fallido', { description: detail });
    },
  });

  const onSubmit = (data: LoginForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-slate-50 overflow-hidden relative">
      {/* Background Decorators */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-700/20 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <div className="w-full max-w-[1000px] flex rounded-2xl shadow-2xl overflow-hidden z-10 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800">
        
        {/* Lado Izquierdo: Branding */}
        <div 
          className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-emerald-950/30 border-r border-zinc-800 relative group"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="z-10">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-8 h-8 text-emerald-500" />
              <h1 className="text-2xl font-bold tracking-tight text-emerald-50">DecData Fundo</h1>
            </div>
            <p className="text-zinc-400 font-light mt-4">
              Sistema Inteligente de Gestión de Contratos Agrícolas con validación de identidad biométrica por huella digital.
            </p>
          </div>

          <div className="z-10 text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Curso de Sistemas Inteligentes.
          </div>

          {/* Micro-animación de la huella */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${isHovering ? 'scale-110 opacity-40' : 'scale-100 opacity-20'}`}>
             <Fingerprint className="w-64 h-64 text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" strokeWidth={1} />
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">Ingresar</h2>
            <p className="text-sm text-zinc-400">Introduce tus credenciales para acceder al sistema.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@fundo.com"
                className="bg-zinc-950/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500 h-11"
                {...register('email')}
              />
              {errors.email && <p className="text-red-400 text-xs font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-zinc-950/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500 h-11"
                {...register('password')}
              />
              {errors.password && <p className="text-red-400 text-xs font-medium">{errors.password.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
          
          {/* Default credentials hint for dev */}
          <div className="mt-8 p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-lg text-xs text-emerald-400/80 text-center">
            <p><strong>Demo Mode:</strong> Usa <code>admin@fundo.com</code> / <code>admin123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
