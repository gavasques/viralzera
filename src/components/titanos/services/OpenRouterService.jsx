/**
 * OpenRouter Service
 * Responsável por todas as chamadas à API OpenRouter
 * Single Responsibility: Comunicação com OpenRouter
 */

// Configurações
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const MAX_HISTORY_MESSAGES = 50; // Limita histórico para performance

/**
 * Erros tipados para melhor tratamento
 */
export class OpenRouterError extends Error {
  constructor(message, code, statusCode = null) {
    super(message);
    this.name = 'OpenRouterError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const ERROR_CODES = {
  NO_API_KEY: 'NO_API_KEY',
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMITED: 'RATE_LIMITED',
  MODEL_ERROR: 'MODEL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_INPUT: 'INVALID_INPUT',
};

/**
 * Sanitiza e valida input do usuário
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Remove caracteres de controle, mantém unicode válido
  return input
    .trim()
    .slice(0, 50000) // Limite de 50k caracteres
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Valida mensagens antes do envio
 */
export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new OpenRouterError('Mensagens inválidas', ERROR_CODES.INVALID_INPUT);
  }
  
  return messages
    .filter(m => m && m.role && m.content)
    .slice(-MAX_HISTORY_MESSAGES) // Limita histórico
    .map(m => ({
      role: String(m.role),
      content: sanitizeInput(m.content),
    }));
}

/**
 * Sleep helper para retry
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Chama OpenRouter com retry e tratamento de erros
 */
export async function callOpenRouter(apiKey, model, messages, options = {}) {
  // Validações
  if (!apiKey || typeof apiKey !== 'string') {
    throw new OpenRouterError('API Key não configurada', ERROR_CODES.NO_API_KEY);
  }
  
  if (!model || typeof model !== 'string') {
    throw new OpenRouterError('Modelo inválido', ERROR_CODES.INVALID_INPUT);
  }

  const validatedMessages = validateMessages(messages);
  
  // Monta body da requisição
  const body = {
    model,
    messages: validatedMessages,
    stream: false,
  };
  
  // Adiciona reasoning se habilitado e modelo suporta
  if (options.enableReasoning && model.includes('claude')) {
    body.reasoning = { effort: options.reasoningEffort || 'high' };
  }
  
  // Adiciona web search se habilitado
  if (options.enableWebSearch) {
    body.plugins = [{ id: 'web' }];
  }

  let lastError = null;
  
  // Retry loop com backoff exponencial
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2min timeout
      
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Multi Chat',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Trata erros HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        
        // Erros que não devem ter retry
        if (response.status === 401) {
          throw new OpenRouterError('API Key inválida', ERROR_CODES.INVALID_API_KEY, 401);
        }
        if (response.status === 429) {
          throw new OpenRouterError('Rate limit excedido. Aguarde um momento.', ERROR_CODES.RATE_LIMITED, 429);
        }
        if (response.status >= 400 && response.status < 500) {
          throw new OpenRouterError(errorMessage, ERROR_CODES.MODEL_ERROR, response.status);
        }
        
        // Erros 5xx podem ter retry
        throw new OpenRouterError(errorMessage, ERROR_CODES.NETWORK_ERROR, response.status);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      const content = data.choices?.[0]?.message?.content || '';
      
      if (!content) {
        throw new OpenRouterError('Resposta vazia do modelo', ERROR_CODES.MODEL_ERROR);
      }
      
      return {
        content,
        usage: data.usage || {},
        duration,
        model: data.model || model,
        id: data.id,
      };
      
    } catch (error) {
      lastError = error;
      
      // Erros que não devem ter retry
      if (error instanceof OpenRouterError && 
          [ERROR_CODES.NO_API_KEY, ERROR_CODES.INVALID_API_KEY, ERROR_CODES.RATE_LIMITED, ERROR_CODES.INVALID_INPUT].includes(error.code)) {
        throw error;
      }
      
      // Timeout
      if (error.name === 'AbortError') {
        lastError = new OpenRouterError('Timeout na requisição', ERROR_CODES.TIMEOUT);
      }
      
      // Se não é última tentativa, aguarda e tenta novamente
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Backoff exponencial
        console.warn(`[OpenRouter] Tentativa ${attempt} falhou, retry em ${delay}ms:`, error.message);
        await sleep(delay);
      }
    }
  }
  
  // Todas as tentativas falharam
  throw lastError || new OpenRouterError('Falha na comunicação', ERROR_CODES.NETWORK_ERROR);
}

/**
 * Prepara histórico de mensagens para envio
 * Otimiza payload removendo campos desnecessários
 */
export function prepareMessagesForSend(messages, newMessage) {
  const history = messages
    .filter(m => m.role && m.content)
    .map(m => ({ role: m.role, content: m.content }));
  
  if (newMessage?.trim()) {
    history.push({ role: 'user', content: sanitizeInput(newMessage) });
  }
  
  return history;
}