/**
 * Serviço para chamadas diretas à API OpenRouter
 * Substitui chamadas via backend para evitar problemas com neon.functions
 */

import { callFunction } from '@/api/neonClient';

/** @deprecated API key agora é gerenciada pelo backend */
export async function getUserApiKey() { return true; }

/** @deprecated Não é mais necessário */
export function invalidateApiKeyCache() {}

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

  const formattedMessages = formatMessagesWithFiles(messages, options.files);

  const body = {
    model,
    messages: formattedMessages.map(m => ({ role: m.role, content: m.content })),
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 32000,
  };

  if (options.enableWebSearch) body.plugins = [{ id: 'web' }];
  if (options.enableReasoning && model.includes('claude')) {
    body.reasoning = { effort: options.reasoningEffort || 'high' };
  }

  const data = await callFunction('openrouter', body);

  if (!data.choices?.[0]?.message) {
    throw new Error('Resposta inválida da IA');
  }

  const message = data.choices[0].message;
  const usage = data.usage ? {
    promptTokens: data.usage.prompt_tokens || 0,
    completionTokens: data.usage.completion_tokens || 0,
    totalTokens: data.usage.total_tokens || 0,
    reasoningTokens: data.usage.completion_tokens_details?.reasoning_tokens || 0,
  } : null;
  const citations = (message.annotations || [])
    .filter(a => a.type === 'url_citation')
    .map(a => ({ url: a.url_citation?.url, title: a.url_citation?.title, content: a.url_citation?.content }));

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