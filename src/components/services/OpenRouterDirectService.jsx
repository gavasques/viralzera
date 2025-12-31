/**
 * Serviço para chamadas diretas à API OpenRouter
 * Substitui chamadas via backend para evitar problemas com base44.functions
 */

import { base44 } from '@/api/base44Client';

// Cache de API Key com TTL
const apiKeyCache = {
  key: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000, // 5 minutos
};

/**
 * Busca API Key do usuário (com cache)
 */
export async function getUserApiKey() {
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
 * Invalida o cache da API Key
 */
export function invalidateApiKeyCache() {
  apiKeyCache.key = null;
  apiKeyCache.timestamp = 0;
}

/**
 * Formata mensagens com arquivos anexados
 */
function formatMessagesWithFiles(messages, files = []) {
  if (!files || files.length === 0) {
    return messages;
  }

  const formattedMessages = [...messages];
  const lastUserMsgIndex = formattedMessages.findLastIndex(m => m.role === 'user');
  
  if (lastUserMsgIndex !== -1) {
    const lastUserMsg = formattedMessages[lastUserMsgIndex];
    const content = [];
    
    if (typeof lastUserMsg.content === 'string') {
      content.push({ type: 'text', text: lastUserMsg.content });
    }
    
    files.forEach(file => {
      if (file.type?.startsWith('image/')) {
        content.push({
          type: 'image_url',
          image_url: { url: file.url }
        });
      } else {
        content.push({
          type: 'text',
          text: `[Arquivo anexado: ${file.name}]\n${file.content || ''}`
        });
      }
    });
    
    formattedMessages[lastUserMsgIndex] = {
      ...lastUserMsg,
      content
    };
  }
  
  return formattedMessages;
}

/**
 * Envia mensagem para OpenRouter (chamada direta à API)
 * 
 * @param {Object} params
 * @param {string} params.model - ID do modelo
 * @param {Array} params.messages - Array de mensagens
 * @param {Object} params.options - Opções adicionais
 * @returns {Promise<Object>} Resposta formatada
 */
export async function sendMessage({
  model,
  messages,
  options = {}
}) {
  if (!model) {
    throw new Error('Modelo não selecionado');
  }

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    throw new Error('Configure sua API Key do OpenRouter em Configurações');
  }

  // Formata mensagens com arquivos se houver
  const formattedMessages = formatMessagesWithFiles(messages, options.files);

  const body = {
    model,
    messages: formattedMessages.map(m => ({ 
      role: m.role, 
      content: m.content 
    })),
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 4000,
  };

  // Adiciona web search se habilitado
  if (options.enableWebSearch) {
    body.plugins = [{ id: 'web' }];
  }

  // Adiciona reasoning se habilitado e modelo suporta
  if (options.enableReasoning && model.includes('claude')) {
    body.reasoning = { effort: options.reasoningEffort || 'high' };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': options.feature || 'ContentAI',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message) {
    throw new Error('Resposta inválida da IA');
  }

  // Extrai usage
  const usage = data.usage ? {
    promptTokens: data.usage.prompt_tokens || 0,
    completionTokens: data.usage.completion_tokens || 0,
    totalTokens: data.usage.total_tokens || 0,
    reasoningTokens: data.usage.completion_tokens_details?.reasoning_tokens || 0,
  } : null;

  // Extrai citations (web search)
  const message = data.choices[0].message;
  const citations = (message.annotations || [])
    .filter(a => a.type === 'url_citation')
    .map(a => ({
      url: a.url_citation?.url,
      title: a.url_citation?.title,
      content: a.url_citation?.content,
    }));

  return {
    content: message.content,
    role: 'assistant',
    usage,
    citations,
    model: data.model,
    finishReason: data.choices[0].finish_reason,
  };
}

export default {
  sendMessage,
  getUserApiKey,
  invalidateApiKeyCache,
};