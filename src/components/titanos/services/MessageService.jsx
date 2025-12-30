/**
 * Message Service
 * Responsável por operações de CRUD de mensagens
 * Single Responsibility: Persistência de mensagens
 */

import { base44 } from '@/api/base44Client';

/**
 * Cria mensagem do usuário
 */
export async function createUserMessage(conversationId, content) {
  if (!conversationId || !content?.trim()) {
    throw new Error('Dados inválidos para criar mensagem');
  }
  
  return base44.entities.TitanosMessage.create({
    conversation_id: conversationId,
    role: 'user',
    content: content.trim(),
    model_id: null,
  });
}

/**
 * Cria mensagem do assistente com métricas
 */
export async function createAssistantMessage(conversationId, modelId, content, metrics = {}) {
  if (!conversationId || !modelId || !content) {
    throw new Error('Dados inválidos para criar mensagem do assistente');
  }
  
  return base44.entities.TitanosMessage.create({
    conversation_id: conversationId,
    role: 'assistant',
    content,
    model_id: modelId,
    metrics: {
      prompt_tokens: metrics.prompt_tokens || 0,
      completion_tokens: metrics.completion_tokens || 0,
      total_tokens: metrics.total_tokens || 0,
      duration_ms: metrics.duration || 0,
      cost: metrics.cost || 0,
    },
  });
}

/**
 * Busca mensagens de uma conversa
 */
export async function getConversationMessages(conversationId) {
  if (!conversationId) return [];
  
  const messages = await base44.entities.TitanosMessage.filter({ 
    conversation_id: conversationId 
  });
  
  return (messages || []).sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );
}

/**
 * Prepara histórico efetivo para envio
 * Considera system prompts de grupo e filtra por modelos selecionados
 */
export function prepareEffectiveHistory(messages, selectedModels, groupSystemPrompt) {
  // Filtra mensagens relevantes
  let effectiveHistory = messages.filter(
    m => m.model_id === null || selectedModels.includes(m.model_id)
  );
  
  // Adiciona system prompt do grupo se necessário
  if (groupSystemPrompt) {
    const hasOwnSystemPrompt = messages.some(m => m.role === 'system');
    if (!hasOwnSystemPrompt) {
      effectiveHistory = [
        { role: 'system', content: groupSystemPrompt },
        ...effectiveHistory.filter(m => m.role !== 'system'),
      ];
    }
  }
  
  return effectiveHistory;
}