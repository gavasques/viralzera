/**
 * OpenRouter Service - Serviço centralizado para integração com OpenRouter API
 * 
 * IMPORTANTE: Todas as chamadas passam pelo backend para proteger a API key
 * 
 * Features:
 * - Extended Reasoning (thinking)
 * - Web Search (:online)
 * - File/PDF attachments
 * - Token usage tracking
 * - Usage logging (feito no backend)
 */

import { callFunction } from "@/api/neonClient";

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
 * Extrai informações de uso de tokens da resposta
 */
function extractUsage(responseData) {
  if (!responseData?.usage) return null;
  
  return {
    promptTokens: responseData.usage.prompt_tokens || 0,
    completionTokens: responseData.usage.completion_tokens || 0,
    totalTokens: responseData.usage.total_tokens || 0,
    reasoningTokens: responseData.usage.completion_tokens_details?.reasoning_tokens || 0,
  };
}

/**
 * Extrai citações web da resposta (quando usa web search)
 */
function extractCitations(responseData) {
  const message = responseData?.choices?.[0]?.message;
  if (!message?.annotations) return [];
  
  return message.annotations
    .filter(a => a.type === 'url_citation')
    .map(a => ({
      url: a.url_citation?.url,
      title: a.url_citation?.title,
      content: a.url_citation?.content,
    }));
}

/**
 * Envia mensagem para OpenRouter (chamada direta à API)
 * 
 * @param {Object} params
 * @param {string} params.model - ID do modelo
 * @param {Array} params.messages - Array de mensagens
 * @param {Object} params.options - Opções adicionais
 * 
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

  return {
    content: data.choices[0].message.content,
    role: 'assistant',
    usage: extractUsage(data),
    citations: extractCitations(data),
    model: data.model,
    finishReason: data.choices[0].finish_reason,
  };
}

/**
 * Busca lista de modelos disponíveis diretamente da API OpenRouter
 * Retorna dados completos incluindo supported_parameters
 */
export async function fetchModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('[fetchModels] Error:', error);
    throw new Error(error.message || 'Erro ao carregar modelos');
  }
}

/**
 * Verifica capacidades do modelo baseado nos supported_parameters da API
 * @param {Object} model - Objeto do modelo com supported_parameters
 * @returns {Object} Capacidades do modelo
 */
export function getModelCapabilities(model) {
  if (!model) return { reasoning: false, webSearch: false, tools: false, supportedParams: [] };
  
  const supportedParams = model.supported_parameters || [];
  
  // Verifica reasoning diretamente nos supported_parameters da API
  // "reasoning" ou "include_reasoning" indicam suporte nativo
  const reasoning = supportedParams.includes('reasoning') || supportedParams.includes('include_reasoning');
  
  // Verifica tools nos supported_parameters
  const tools = supportedParams.includes('tools') || supportedParams.includes('tool_choice');
  
  // Web search disponível para todos via :online
  const webSearch = true;
  
  console.log(`[getModelCapabilities] Model: ${model.id || model.name}, supported_parameters:`, supportedParams);
  console.log(`[getModelCapabilities] Detected - reasoning: ${reasoning}, tools: ${tools}`);
  
  return {
    reasoning,
    webSearch,
    tools,
    structuredOutput: supportedParams.includes('response_format') || supportedParams.includes('structured_outputs'),
    supportedParams,
    // Parâmetros específicos - verifica diretamente no array
    hasTemperature: supportedParams.includes('temperature'),
    hasTopP: supportedParams.includes('top_p'),
    hasTopK: supportedParams.includes('top_k'),
    hasFrequencyPenalty: supportedParams.includes('frequency_penalty'),
    hasPresencePenalty: supportedParams.includes('presence_penalty'),
    hasRepetitionPenalty: supportedParams.includes('repetition_penalty'),
    hasMaxTokens: supportedParams.includes('max_tokens'),
    hasStop: supportedParams.includes('stop'),
    hasSeed: supportedParams.includes('seed'),
    // Defaults do modelo
    defaults: model.default_parameters || {}
  };
}

/**
 * Verifica se modelo suporta Extended Reasoning
 * Usa dados da API se disponível, senão faz fallback para heurística
 */
export function supportsReasoning(model) {
  if (!model) return false;
  
  // Se tiver supported_parameters, usa dados reais da API
  if (model.supported_parameters) {
    return model.supported_parameters.includes('reasoning') || 
           model.supported_parameters.includes('include_reasoning');
  }
  
  // Fallback: heurística baseada no ID
  const id = (typeof model === 'string' ? model : model.id || '').toLowerCase();
  
  const reasoningKeywords = ['thinking', 'reasoning', 'deepseek-r1', 'o1', 'o3', 'qwq'];
  
  // Claude 3.5+ suporta reasoning
  const claudeMatch = id.match(/claude-(opus|sonnet|haiku)-?([0-9.]*)/);
  if (claudeMatch) {
    const version = parseFloat(claudeMatch[2]) || 0;
    if (version >= 3.5 || id.includes('sonnet-4') || id.includes('opus-4')) return true;
  }
  
  // Gemini 2.0+ thinking models
  if (id.includes('gemini') && (id.includes('thinking') || id.includes('flash-thinking'))) return true;
  
  return reasoningKeywords.some(keyword => id.includes(keyword));
}

/**
 * Verifica se modelo suporta Tool Calling
 */
export function supportsTools(model) {
  if (!model) return false;
  
  if (model.supported_parameters) {
    return model.supported_parameters.includes('tools') || 
           model.supported_parameters.includes('tool_choice');
  }
  
  return false;
}

/**
 * Verifica se modelo tem Web Search nativo (via provider)
 * Note: OpenRouter permite web search em qualquer modelo via plugin :online
 */
export function hasNativeWebSearch(model) {
  if (!model) return false;
  const id = (typeof model === 'string' ? model : model.id || '').toLowerCase();
  
  // Estes providers têm web search nativo mais eficiente
  return id.includes('perplexity') || 
         id.includes('openai/') || 
         id.includes('anthropic/') || 
         id.includes('x-ai/') || 
         id.includes('xai/');
}

export default {
  sendMessage,
  fetchModels,
  supportsReasoning,
  supportsTools,
  hasNativeWebSearch,
  getModelCapabilities,
};