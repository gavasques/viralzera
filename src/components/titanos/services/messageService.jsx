/**
 * Serviço para gerenciamento de mensagens
 * Responsabilidade única: CRUD de mensagens e preparação de histórico
 */

import { base44 } from '@/api/base44Client';

/**
 * Salva mensagem do usuário no banco
 * @param {string} conversationId - ID da conversa
 * @param {string} content - Conteúdo da mensagem
 * @returns {Promise<Object>} Mensagem criada
 */
export async function saveUserMessage(conversationId, content) {
  if (!conversationId) throw new Error('conversationId é obrigatório');
  if (!content?.trim()) throw new Error('Conteúdo da mensagem é obrigatório');
  
  return base44.entities.TitanosMessage.create({
    conversation_id: conversationId,
    role: 'user',
    content: content.trim(),
    model_id: null,
  });
}

/**
 * Salva resposta do assistente no banco
 * @param {string} conversationId - ID da conversa
 * @param {string} modelId - ID do modelo
 * @param {string} content - Conteúdo da resposta
 * @param {Object} metrics - Métricas (tokens, duração, custo)
 * @returns {Promise<Object>} Mensagem criada
 */
export async function saveAssistantMessage(conversationId, modelId, content, metrics = {}) {
  if (!conversationId) throw new Error('conversationId é obrigatório');
  if (!modelId) throw new Error('modelId é obrigatório');
  
  return base44.entities.TitanosMessage.create({
    conversation_id: conversationId,
    role: 'assistant',
    content: content || '',
    model_id: modelId,
    metrics: {
      prompt_tokens: metrics.prompt_tokens || 0,
      completion_tokens: metrics.completion_tokens || 0,
      total_tokens: metrics.total_tokens || 0,
      duration_ms: metrics.duration_ms || 0,
      cost: metrics.cost || 0,
    },
  });
}

/**
 * Prepara histórico de mensagens para envio à API
 * @param {Array} messages - Mensagens existentes
 * @param {Array<string>} selectedModels - Modelos selecionados
 * @param {string} newMessage - Nova mensagem do usuário
 * @returns {Array} Histórico formatado para API
 */
export function prepareMessageHistory(messages, selectedModels, newMessage) {
  // Filtra mensagens relevantes
  const relevantMessages = messages.filter(
    m => m.model_id === null || selectedModels.includes(m.model_id)
  );
  
  // Formata para API
  const history = relevantMessages.map(m => ({
    role: m.role,
    content: m.content,
  }));
  
  // Adiciona nova mensagem
  if (newMessage?.trim()) {
    history.push({ role: 'user', content: newMessage.trim() });
  }
  
  return history;
}

/**
 * Adiciona system prompt do grupo se necessário
 * @param {Array} history - Histórico de mensagens
 * @param {Array} messages - Mensagens originais
 * @param {Object} conversation - Conversa ativa
 * @param {Array} groups - Lista de grupos
 * @returns {Array} Histórico com system prompt
 */
export function injectGroupSystemPrompt(history, messages, conversation, groups) {
  if (!conversation?.group_id || !groups?.length) return history;
  
  const group = groups.find(g => g.id === conversation.group_id);
  if (!group?.default_system_prompt) return history;
  
  // Verifica se já tem system prompt
  const hasSystemPrompt = messages.some(m => m.role === 'system');
  if (hasSystemPrompt) return history;
  
  // Adiciona system prompt no início
  return [
    { role: 'system', content: group.default_system_prompt },
    ...history.filter(m => m.role !== 'system'),
  ];
}

/**
 * Filtra mensagens para um modelo específico
 * @param {Array} messages - Todas as mensagens
 * @param {string} modelId - ID do modelo
 * @returns {Array} Mensagens filtradas e ordenadas
 */
export function getMessagesForModel(messages, modelId) {
  return messages
    .filter(m => m.role === 'user' || m.role === 'system' || m.model_id === modelId)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
}

/**
 * Prepara histórico para regeneração
 * @param {Array} messages - Todas as mensagens
 * @returns {Array} Histórico para regeneração
 */
export function prepareRegenerateHistory(messages) {
  const userMessages = messages.filter(m => m.role === 'user' && !m.model_id);
  if (userMessages.length === 0) return null;
  
  const systemMessages = messages
    .filter(m => m.role === 'system')
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  
  return {
    firstUserMessage: userMessages[0],
    history: [
      ...systemMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessages[0].content },
    ],
  };
}

/**
 * Prepara histórico para chat single model
 * @param {Array} messages - Todas as mensagens
 * @param {string} modelId - ID do modelo
 * @returns {Array} Histórico formatado
 */
export function prepareSingleModelHistory(messages, modelId) {
  return messages
    .filter(m => m.role === 'system' || m.role === 'user' || m.model_id === modelId)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .map(m => ({ role: m.role, content: m.content }));
}