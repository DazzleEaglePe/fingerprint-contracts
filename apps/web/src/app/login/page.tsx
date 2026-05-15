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
    <div className="min-h-screen flex items-center justify-center bg-black text-slate-50 overflow-hidden relative font-sans">
      <div className="w-full max-w-[1050px] min-h-[600px] flex rounded-[2rem] overflow-hidden shadow-2xl relative">
        
        {/* Lado Izquierdo: Green Gradient Panel */}
        <div className="hidden md:flex flex-col justify-end w-[45%] p-12 bg-gradient-to-br from-[#104832] via-[#0b3323] to-[#04140d] relative overflow-hidden">
          
          {/* Subtle glow effect */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
          </div>

          <div className="z-10 w-full mb-8">
            <div className="flex gap-4 items-end mb-16">
              <h1 className="text-4xl font-medium tracking-tight text-white leading-tight">
                Acceso<br />Seguro<br />DecData
              </h1>
              <p className="text-emerald-200/70 text-sm max-w-[140px] mb-2 leading-relaxed">
                Gestión biométrica de contratos agrícolas.
              </p>
            </div>

            <div className="flex gap-3">
              {/* Card 1 - Active/White */}
              <div className="bg-white text-black p-4 rounded-2xl flex-1 shadow-lg transform hover:-translate-y-1 transition-transform">
                <div className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold mb-3">1</div>
                <p className="text-xs font-semibold leading-tight">Accede a tu<br/>cuenta</p>
              </div>

              {/* Card 2 - Glassmorphic Green */}
              <div className="bg-white/10 backdrop-blur-md border border-white/10 text-white p-4 rounded-2xl flex-1 shadow-lg transform hover:-translate-y-1 transition-transform">
                <div className="w-5 h-5 bg-white/20 text-white rounded-full flex items-center justify-center text-[10px] font-bold mb-3">2</div>
                <p className="text-xs font-medium leading-tight opacity-80">Valida tu<br/>identidad</p>
              </div>

              {/* Card 3 - Glassmorphic Green */}
              <div className="bg-white/10 backdrop-blur-md border border-white/10 text-white p-4 rounded-2xl flex-1 shadow-lg transform hover:-translate-y-1 transition-transform">
                <div className="w-5 h-5 bg-white/20 text-white rounded-full flex items-center justify-center text-[10px] font-bold mb-3">3</div>
                <p className="text-xs font-medium leading-tight opacity-80">Firma<br/>contratos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario Black */}
        <div className="w-full md:w-[55%] bg-[#0a0a0a] p-8 md:p-16 flex flex-col justify-center items-center">
          <div className="w-full max-w-[360px]">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-medium text-white mb-2 tracking-wide">Bienvenido de nuevo</h2>
              <p className="text-xs text-zinc-500">Ingresa tus credenciales para acceder al sistema.</p>
            </div>

            {/* Social Logins (Visual only to match design) */}
            <div className="flex gap-3 mb-8">
              <button type="button" className="flex-1 py-2.5 rounded-full border border-zinc-800 bg-transparent text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button type="button" className="flex-1 py-2.5 rounded-full border border-zinc-800 bg-transparent text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
                Github
              </button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#0a0a0a] px-2 text-zinc-600 font-medium">Or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-zinc-400 font-normal">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="eg. admin@fundo.com"
                  className="bg-[#121212] border-transparent text-white placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-0 h-11 rounded-lg text-sm"
                  {...register('email')}
                />
                {errors.email && <p className="text-red-400 text-[10px]">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-zinc-400 font-normal">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="bg-[#121212] border-transparent text-white placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-0 h-11 rounded-lg text-sm pr-10"
                    {...register('password')}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
                  </div>
                </div>
                {errors.password && <p className="text-red-400 text-[10px]">{errors.password.message}</p>}
              </div>
              
              <div className="text-[10px] text-zinc-600 pt-1 pb-4">
                Must be at least 6 characters.
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-white hover:bg-zinc-200 text-black font-semibold rounded-full transition-colors text-sm"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-xs text-zinc-500">
              ¿Olvidaste tu contraseña? <a href="#" className="text-white hover:underline">Recuperar</a>
            </div>
            
            {/* Demo Mode Notice */}
            <div className="mt-8 text-center text-[10px] text-zinc-700">
              Demo: admin@fundo.com / admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
