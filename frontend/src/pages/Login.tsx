import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useEmpresaStore } from '../store/empresaStore';
import type { FilialInfo } from '../store/empresaStore';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();
  const { setActiveFilial } = useEmpresaStore();

  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setErrorMsg('');

      const response = await api.post('/api/v1/auth/login', {
        email: data.email,
        password: data.password
      });

      const token = response.data.access_token;
      const user = response.data.user;

      setAuth(token, user);

      const filiaisResp = await api.get<FilialInfo[]>('/api/v1/auth/filiais', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filiais = filiaisResp.data;

      queryClient.setQueryData(['filiais'], filiais);

      if (filiais.length === 1) {
        setActiveFilial(filiais[0]);
        navigate('/app/dashboard');
      } else if (filiais.length > 1) {
        navigate('/hub');
      } else {
        setErrorMsg('Você não possui acesso a nenhuma Filial.');
      }
    } catch (error: any) {
      console.group('🚨 [LOGIN ERROR DETAIL]');
      
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 404) {
          setErrorMsg('Credenciais inválidas. Tente novamente.');
        } else if (error.response.data?.detail) {
          const det = typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : JSON.stringify(error.response.data.detail);
          setErrorMsg(`Erro na API (${error.response.status}): ${det}`);
        } else {
          setErrorMsg(`Ocorreu um erro no servidor (Status: ${error.response.status}). Verifique o console.`);
        }
      } else if (error.request) {
        setErrorMsg('Não foi possível conectar ao servidor. Verifique o console para detalhes.');
      } else {
        setErrorMsg('Erro interno no navegador. Verifique o console.');
      }
      
      console.groupEnd();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      
      {/* Box Container */}
      <div className="relative z-10 w-full max-w-md">
        
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <img 
            src="/logo.png" 
            alt="VimaERP" 
            className="h-28 sm:h-32 w-auto mx-auto mb-6 drop-shadow"
          />
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Bem-vindo
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Insira suas credenciais corporativas
          </p>
        </div>

        <div className="rounded-3xl p-[1px] transition-all duration-500 hover:shadow-2xl animate-in fade-in zoom-in-95 duration-500 bg-transparent shadow border border-slate-200">
          <div className="p-8 sm:p-10 rounded-[1.4rem] backdrop-blur-xl bg-white/90">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {errorMsg && (
                <div className="p-4 rounded-xl text-sm font-medium flex items-center justify-center animate-in fade-in bg-red-50 text-red-600 border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">
                  E-mail de Acesso
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 transition-colors text-slate-400 group-focus-within:text-blue-500" />
                  </div>
                  <input
                    type="email"
                    {...register('email')}
                    className="block w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all border bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900 placeholder-slate-400 focus:bg-white"
                    placeholder="seu@email.com.br"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">
                  Senha
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 transition-colors text-slate-400 group-focus-within:text-blue-500" />
                  </div>
                  <input
                    type="password"
                    {...register('password')}
                    className="block w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all border bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900 placeholder-slate-400 focus:bg-white"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full relative group/btn overflow-hidden rounded-xl p-[1px] disabled:opacity-50 mt-4"
                >
                  <span className="absolute inset-0 transition-opacity duration-300 bg-blue-600"></span>
                  <div className="relative flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        Autenticando...
                      </>
                    ) : (
                      <>
                        Entrar na Plataforma
                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center text-sm font-medium">
          <p className="text-slate-500">
            Powered by Vima Sistemas &copy; {new Date().getFullYear()}
          </p>
        </div>

      </div>
    </div>
  );
}
