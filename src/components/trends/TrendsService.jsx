/**
 * Serviço para pesquisa de tendências via OpenRouter
 * Chamada direta à API (sem backend)
 */

import { base44 } from '@/api/base44Client';

/**
 * Cache de API Key com TTL
 */
const apiKeyCache = {
  key: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000, // 5 minutos
};

/**
 * Busca API Key do usuário (com cache)
 */
async function getUserApiKey() {
  const now = Date.now();
  
  if (apiKeyCache.key && (now - apiKeyCache.timestamp) < apiKeyCache.TTL) {
    return apiKeyCache.key;
  }
  
  const configs = await base44.entities.UserConfig.list();
  const config = configs?.[0];
  
  apiKeyCache.key = config?.openrouter_api_key || null;
  apiKeyCache.timestamp = now;
  
  return apiKeyCache.key;
}

/**
 * Pesquisa tendências via OpenRouter com Web Search habilitado
 * @param {Object} params - Parâmetros da pesquisa
 * @param {string} params.model - ID do modelo OpenRouter
 * @param {string} params.prompt - Prompt da pesquisa
 * @returns {Promise<Object>} Resultado da pesquisa
 */
export async function searchTrends({ model, prompt }) {
  const apiKey = await getUserApiKey();
  
  if (!apiKey) {
    throw new Error('Configure sua API Key do OpenRouter em Configurações');
  }

  if (!model) {
    throw new Error('Modelo de busca não configurado');
  }

  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4096,
    plugins: [{ id: 'web' }], // Habilita Web Search
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Trends Search',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;

  if (!message?.content) {
    throw new Error('Nenhum resultado retornado. Tente outro modelo ou refine sua busca.');
  }

  return {
    content: message.content,
    annotations: message.annotations || [],
    usage: data.usage || {},
  };
}