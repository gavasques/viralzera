/**
 * API Key Service
 * Responsável por gerenciar a API Key do usuário com cache
 * Single Responsibility: Gerenciamento de API Keys
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const API_KEY_CACHE_KEY = ['user-openrouter-api-key'];
const API_KEY_STALE_TIME = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para buscar API Key com cache via React Query
 */
export function useOpenRouterApiKey() {
  return useQuery({
    queryKey: API_KEY_CACHE_KEY,
    queryFn: async () => {
      const configs = await base44.entities.UserConfig.list();
      const config = configs?.[0];
      return config?.openrouter_api_key || null;
    },
    staleTime: API_KEY_STALE_TIME,
    gcTime: 10 * 60 * 1000, // 10 minutos no cache
    retry: 1,
  });
}

/**
 * Função imperativa para buscar API Key (com cache manual)
 * Para uso em callbacks onde hooks não são permitidos
 */
let cachedApiKey = null;
let cacheTimestamp = 0;

export async function getApiKey() {
  const now = Date.now();
  
  // Retorna cache se ainda válido
  if (cachedApiKey && (now - cacheTimestamp) < API_KEY_STALE_TIME) {
    return cachedApiKey;
  }
  
  try {
    const configs = await base44.entities.UserConfig.list();
    const config = configs?.[0];
    cachedApiKey = config?.openrouter_api_key || null;
    cacheTimestamp = now;
    return cachedApiKey;
  } catch (error) {
    console.error('[ApiKeyService] Erro ao buscar API Key:', error);
    return cachedApiKey; // Retorna cache antigo em caso de erro
  }
}

/**
 * Invalida o cache da API Key
 */
export function invalidateApiKeyCache(queryClient) {
  cachedApiKey = null;
  cacheTimestamp = 0;
  queryClient?.invalidateQueries({ queryKey: API_KEY_CACHE_KEY });
}

/**
 * Verifica se existe API Key configurada
 */
export function hasApiKey() {
  return !!cachedApiKey;
}