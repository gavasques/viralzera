/**
 * Serviço para comunicação com OpenRouter API
 * Responsabilidade única: chamadas à API com retry e tratamento de erros
 */

import { base44 } from '@/api/base44Client';

// Cache de API key com TTL
let apiKeyCache = {
  key: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutos
};

/**
 * Limpa o cache da API key (útil para logout ou troca de usuário)
 */
export function clearApiKeyCache() {
  apiKeyCache = { key: null, timestamp: 0, ttl: apiKeyCache.ttl };
}

/**
 * Busca API Key do usuário com cache TTL
 */
export async function getUserApiKey() {
  const now = Date.now();
  
  // Retorna cache se válido
  if (apiKeyCache.key && (now - apiKeyCache.timestamp) < apiKeyCache.ttl) {
    return apiKeyCache.key;
  }
  
  const configs = await base44.entities.UserConfig.list();
  const config = configs?.[0];
  const apiKey = config?.openrouter_api_key;
  
  // Atualiza cache
  if (apiKey) {
    apiKeyCache = { key: apiKey, timestamp: now, ttl: apiKeyCache.ttl };
  }
  
  return apiKey;
}

/**
 * Valida se a API key está configurada
 */
export async function validateApiKey() {
  const apiKey = await getUserApiKey();
  return { isValid: !!apiKey, apiKey };
}

/**
 * Configuração de retry
 */
const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1000,
  retryableStatuses: [429, 500, 502, 503, 504],
};

/**
 * Delay com backoff exponencial
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Chama OpenRouter com retry automático
 * @param {string} apiKey - API key do OpenRouter
 * @param {string} model - ID do modelo (ex: openai/gpt-4o)
 * @param {Array} messages - Array de mensagens {role, content}
 * @param {Object} options - Opções adicionais (reasoning, webSearch)
 * @returns {Promise<{content, usage, duration, rawResponse}>}
 */
export async function callOpenRouter(apiKey, model, messages, options = {}) {
  // Validação de entrada
  if (!apiKey) throw new Error('API key não fornecida');
  if (!model) throw new Error('Modelo não especificado');
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Mensagens inválidas');
  }

  const body = buildRequestBody(model, messages, options);
  const startTime = Date.now();
  
  let lastError = null;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Multi Chat',
        },
        body: JSON.stringify(body),
      });

      // Verifica se deve fazer retry
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error?.message || `OpenRouter error: ${response.status}`);
        error.status = response.status;
        error.errorData = errorData;
        
        // Retry apenas para erros retryable
        if (RETRY_CONFIG.retryableStatuses.includes(response.status) && attempt < RETRY_CONFIG.maxRetries) {
          lastError = error;
          await delay(RETRY_CONFIG.baseDelay * Math.pow(2, attempt));
          continue;
        }
        
        throw error;
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage,
        duration,
        rawResponse: data,
      };
      
    } catch (err) {
      lastError = err;
      
      // Se for erro de rede ou timeout, tenta retry
      if (err.name === 'TypeError' && attempt < RETRY_CONFIG.maxRetries) {
        await delay(RETRY_CONFIG.baseDelay * Math.pow(2, attempt));
        continue;
      }
      
      throw err;
    }
  }
  
  throw lastError || new Error('Falha após múltiplas tentativas');
}

/**
 * Constrói o body da requisição
 */
function buildRequestBody(model, messages, options) {
  const body = {
    model,
    messages: messages.map(m => ({ 
      role: sanitizeRole(m.role), 
      content: m.content || '' 
    })),
  };
  
  // Adiciona reasoning se habilitado e modelo suporta
  if (options.enableReasoning && supportsReasoning(model)) {
    body.reasoning = { effort: options.reasoningEffort || 'high' };
  }
  
  // Adiciona web search se habilitado
  if (options.enableWebSearch) {
    body.plugins = [{ id: 'web' }];
  }
  
  return body;
}

/**
 * Sanitiza role para valores válidos
 */
function sanitizeRole(role) {
  const validRoles = ['system', 'user', 'assistant'];
  return validRoles.includes(role) ? role : 'user';
}

/**
 * Verifica se modelo suporta reasoning
 */
function supportsReasoning(model) {
  const reasoningModels = ['claude', 'o1', 'deepseek-r1'];
  return reasoningModels.some(m => model.toLowerCase().includes(m));
}

/**
 * Chama múltiplos modelos em paralelo com controle de concorrência
 * @param {string} apiKey - API key
 * @param {Array<string>} modelIds - IDs dos modelos
 * @param {Array} messages - Mensagens
 * @param {Object} options - Opções
 * @returns {Promise<Array<{modelId, success, result?, error?}>>}
 */
export async function callMultipleModels(apiKey, modelIds, messages, options = {}) {
  const results = await Promise.allSettled(
    modelIds.map(async (modelId) => {
      try {
        const result = await callOpenRouter(apiKey, modelId, messages, options);
        return { modelId, success: true, result };
      } catch (err) {
        console.error(`[OpenRouter] Error for ${modelId}:`, err.message);
        return { modelId, success: false, error: err.message };
      }
    })
  );

  return results.map(r => r.status === 'fulfilled' ? r.value : { 
    modelId: 'unknown', 
    success: false, 
    error: r.reason?.message || 'Unknown error' 
  });
}