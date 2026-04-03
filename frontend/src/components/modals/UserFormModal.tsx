import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useThemeStore } from '../../store/themeStore';
import type { FilialInfo } from '../../store/empresaStore';

const userSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role_id: z.coerce.number().min(1, "Selecione o perfil de acesso"),
  extra_permission_ids: z.array(z.number()).optional().default([]),
  filiais_ids: z.array(z.string()).min(1, "Selecione ao menos uma unidade"),
});

type UserFormData = z.infer<typeof userSchema>;

interface Role {
  id: number;
  name: string;
  permissions: { id: number; name: string }[];
}

interface Permission {
  id: number;
  name: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserFormModal({ isOpen, onClose }: UserFormModalProps) {
  const { isDarkMode } = useThemeStore();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role_id: 0,
      extra_permission_ids: [],
      filiais_ids: []
    }
  });

  const selectedFiliais = watch('filiais_ids') || [];
  const selectedRoleId = watch('role_id');
  const selectedExtraPerms = watch('extra_permission_ids') || [];

  // 1. Fetch Filiais
  const { data: filiais } = useQuery<FilialInfo[]>({
    queryKey: ['filiais'],
    queryFn: async () => {
      const response = await api.get('/api/v1/auth/filiais');
      return response.data;
    },
    enabled: isOpen
  });

  // 2. Fetch Roles (Perfis) disponíveis para o tenant
  const { data: roles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/rbac/roles');
      return data;
    },
    enabled: isOpen
  });

  // 3. Fetch Todas PermissõesGlobais
  const { data: allPermissions } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/rbac/permissions');
      return data;
    },
    enabled: isOpen
  });

  // MUTAÇÃO: Criar Usuário
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await api.post('/api/v1/users/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      setApiError(error.response?.data?.detail || "Erro inesperado ao criar usuário.");
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset();
      setApiError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = (data: UserFormData) => {
    setApiError(null);
    createUserMutation.mutate(data);
  };

  const toggleFilial = (id: string) => {
    if (selectedFiliais.includes(id)) {
      setValue('filiais_ids', selectedFiliais.filter(f => f !== id), { shouldValidate: true });
    } else {
      setValue('filiais_ids', [...selectedFiliais, id], { shouldValidate: true });
    }
  };

  const toggleExtraPermission = (id: number) => {
    if (selectedExtraPerms.includes(id)) {
      setValue('extra_permission_ids', selectedExtraPerms.filter(p => p !== id));
    } else {
      setValue('extra_permission_ids', [...selectedExtraPerms, id]);
    }
  };

  // Computa permissões da role escolhida para omiti-las da lista de extras
  const activeRolePermissionsIds = useMemo(() => {
    if (!selectedRoleId || !roles) return new Set<number>();
    const roleOpt = roles.find(r => r.id === Number(selectedRoleId));
    if (!roleOpt) return new Set<number>();
    return new Set(roleOpt.permissions.map(p => p.id));
  }, [selectedRoleId, roles]);

  const availableExtraPermissions = useMemo(() => {
    if (!allPermissions) return [];
    return allPermissions.filter(p => !activeRolePermissionsIds.has(p.id));
  }, [allPermissions, activeRolePermissionsIds]);

  // Se trocar de role e houver extras que agora fazem parte da role, limpá-los da lista de extras
  useEffect(() => {
    if (selectedExtraPerms.length > 0 && activeRolePermissionsIds.size > 0) {
      const cleanedExtras = selectedExtraPerms.filter(p => !activeRolePermissionsIds.has(p));
      if (cleanedExtras.length !== selectedExtraPerms.length) {
        setValue('extra_permission_ids', cleanedExtras);
      }
    }
  }, [selectedRoleId, activeRolePermissionsIds]);

  if (!isOpen) return null;

  const inputClass = `w-full px-4 py-3 rounded-xl outline-none transition-all border text-sm appearance-none ${
    isDarkMode 
      ? 'bg-[#111] border-white/10 focus:border-violet-500 text-white placeholder-slate-600' 
      : 'bg-white border-slate-200 focus:border-violet-500 text-slate-900 placeholder-slate-400 shadow-sm'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh] ${
        isDarkMode ? 'bg-[#0f0f11] border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        
        <div className={`flex items-center justify-between px-6 py-5 border-b shrink-0 ${
          isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white'
        }`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Cadastrar Novo Usuário
          </h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="userForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {apiError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
                {apiError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nome Completo
                </label>
                <input
                  type="text"
                  {...register('nome')}
                  className={inputClass}
                  placeholder="Ex: João Silva"
                />
                {errors.nome && <p className="text-red-500 text-xs font-medium">{errors.nome.message}</p>}
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className={inputClass}
                  placeholder="usuario@empresa.com.br"
                />
                {errors.email && <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Senha Provisória
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className={inputClass}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.password && <p className="text-red-500 text-xs font-medium">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Perfil (Role)
                </label>
                <select
                  {...register('role_id')}
                  className={inputClass}
                >
                  <option value={0} disabled>Selecione um Perfil...</option>
                  {roles?.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                {errors.role_id && <p className="text-red-500 text-xs font-medium">{errors.role_id.message}</p>}
              </div>
            </div>

            <div className={`mt-6 border-t pt-6 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Permissões Extras (Opcionais)
              </label>
              <p className={`text-xs mt-1 mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                Adicione direitos específicos que não estão no perfil principal escolhido.
              </p>

              {Number(selectedRoleId) === 0 ? (
                <div className={`text-sm italic p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                  Selecione um perfil primeiro para visualizar as permissões extras disponíveis.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                  {availableExtraPermissions.map(perm => {
                    const isSelected = selectedExtraPerms.includes(perm.id);
                    return (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => toggleExtraPermission(perm.id)}
                        className={`flex items-start gap-2 p-2 rounded-lg text-left border transition-colors ${
                          isSelected
                            ? (isDarkMode ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-blue-50 border-blue-200 text-blue-700')
                            : (isDarkMode ? 'bg-[#111] border-white/5 text-slate-400 hover:border-white/20' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300')
                        }`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected 
                             ? (isDarkMode ? 'bg-cyan-500 border-cyan-500 text-[#0f0f11]' : 'bg-blue-600 border-blue-600 text-white')
                             : (isDarkMode ? 'border-slate-600 bg-transparent' : 'border-slate-300 bg-white')
                          }`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="text-xs font-semibold leading-tight">{perm.name.split('.').join(' ').toUpperCase()}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={`mt-6 border-t pt-6 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Unidades e Lojas Autorizadas
              </label>
              <p className={`text-xs mt-1 mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                O usuário só terá acesso aos dados das empresas selecionadas abaixo.
              </p>

              <div className="flex flex-wrap gap-2">
                {filiais?.map(filial => {
                  const isSelected = selectedFiliais.includes(filial.id);
                  return (
                    <button
                      key={filial.id}
                      type="button"
                      onClick={() => toggleFilial(filial.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        isSelected
                          ? (isDarkMode 
                              ? 'bg-violet-600/20 border-violet-500/50 text-violet-300' 
                              : 'bg-violet-50 border-violet-300 text-violet-800 shadow-sm'
                            )
                          : (isDarkMode 
                              ? 'bg-[#111] border-white/10 text-slate-400 hover:border-white/20' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
                            )
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        isSelected 
                          ? (isDarkMode ? 'bg-violet-500 border-violet-500 text-white' : 'bg-violet-600 border-violet-600 text-white')
                          : (isDarkMode ? 'border-slate-600' : 'border-slate-300')
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                      {filial.nome}
                    </button>
                  );
                })}
              </div>
              {errors.filiais_ids && <p className="text-red-500 text-xs font-medium mt-2">{errors.filiais_ids.message}</p>}
            </div>

          </form>
        </div>

        <div className={`px-6 py-5 border-t flex justify-end gap-3 shrink-0 ${
          isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
        }`}>
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
              isDarkMode ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            Cancelar
          </button>
          
          <button 
            type="submit"
            form="userForm"
            disabled={isSubmitting}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none ${
              isDarkMode 
                ? 'bg-gradient-to-r from-violet-600 flex-1 sm:flex-none to-cyan-600 text-white shadow-violet-500/25 hover:shadow-cyan-500/40' 
                : 'bg-slate-900 text-white flex-1 sm:flex-none shadow-md hover:shadow-lg hover:bg-slate-800'
            }`}
          >
            {isSubmitting ? 'Gerando...' : 'Finalizar Cadastro'}
          </button>
        </div>
      </div>
    </div>
  );
}
