import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * HOC para proteger páginas administrativas
 * Verifica se o usuário é admin antes de renderizar o conteúdo
 */
export function AdminProtection({ children }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['admin-user-check'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
    retry: 1,
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      // Opcional: redirecionar para dashboard
      console.warn('Acesso negado: apenas administradores');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="border-red-200 bg-red-50 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Erro de Autenticação</h2>
            <p className="text-sm text-red-700">
              Não foi possível verificar suas credenciais. Por favor, faça login novamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="border-amber-200 bg-amber-50 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-amber-900 mb-2">Acesso Restrito</h2>
            <p className="text-sm text-amber-700 mb-4">
              Esta área é restrita a administradores do sistema.
            </p>
            <p className="text-xs text-amber-600">
              Usuário atual: {user.email} ({user.role})
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook para verificar se o usuário é admin
 */
export function useAdminCheck() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user-check'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  return {
    isAdmin: user?.role === 'admin',
    user,
    isLoading,
  };
}