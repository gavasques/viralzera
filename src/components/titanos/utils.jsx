/**
 * Utilitários para Multi Chat
 * Funções puras para formatação e cálculos
 */

/**
 * Formata número de tokens para exibição
 * @param {number} tokens - Número de tokens
 * @returns {string} Tokens formatados
 */
export function formatTokens(tokens) {
  if (!tokens || tokens === 0) return '0';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

/**
 * Formata custo em USD
 * @param {number} cost - Custo em USD
 * @returns {string} Custo formatado
 */
export function formatCost(cost) {
  if (!cost || cost === 0) return '$0.00';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

/**
 * Formata duração em ms para exibição
 * @param {number} ms - Duração em milissegundos
 * @returns {string} Duração formatada
 */
export function formatDuration(ms) {
  if (!ms || ms === 0) return '0s';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Extrai nome do modelo a partir do ID
 * @param {string} modelId - ID do modelo (ex: openai/gpt-4o)
 * @returns {string} Nome do modelo
 */
export function extractModelName(modelId) {
  if (!modelId) return 'Modelo';
  const parts = modelId.split('/');
  return parts.length > 1 ? parts[1] : modelId;
}

/**
 * Calcula métricas agregadas das mensagens
 * @param {Array} messages - Array de mensagens
 * @returns {Object} Métricas calculadas
 */
export function calculateMetrics(messages) {
  if (!Array.isArray(messages)) {
    return { totalTokens: 0, totalCost: 0, totalDuration: 0, avgDuration: 0, responseCount: 0 };
  }

  let totalTokens = 0;
  let totalCost = 0;
  let totalDuration = 0;
  let responseCount = 0;

  messages.forEach(msg => {
    if (msg.role !== 'assistant' || !msg.metrics) return;
    
    const metrics = msg.metrics;
    const promptTokens = metrics.prompt_tokens || 0;
    const completionTokens = metrics.completion_tokens || 0;
    
    totalTokens += metrics.total_tokens || (promptTokens + completionTokens) || 0;
    totalDuration += metrics.duration_ms || metrics.duration || 0;
    totalCost += metrics.cost || ((promptTokens * 0.000001) + (completionTokens * 0.000002));
    responseCount++;
  });

  return {
    totalTokens,
    totalCost,
    totalDuration,
    avgDuration: responseCount > 0 ? totalDuration / responseCount : 0,
    responseCount,
  };
}

/**
 * Filtra mensagens para um modelo específico
 * @param {Array} messages - Todas as mensagens
 * @param {string} modelId - ID do modelo
 * @returns {Array} Mensagens filtradas e ordenadas
 */
export function getMessagesForModel(messages, modelId) {
  if (!Array.isArray(messages)) return [];
  
  return messages
    .filter(m => m.role === 'user' || m.role === 'system' || m.model_id === modelId)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
}

/**
 * Obtém alias do modelo a partir da lista de modelos aprovados
 * @param {string} modelId - ID do modelo
 * @param {Array} approvedModels - Lista de modelos aprovados
 * @returns {string} Alias ou nome extraído
 */
export function getModelAlias(modelId, approvedModels = []) {
  if (!modelId) return 'Modelo';
  const approved = approvedModels.find(m => m.model_id === modelId);
  return approved?.alias || extractModelName(modelId);
}

/**
 * Valida se uma string é um role válido
 * @param {string} role - Role a validar
 * @returns {boolean}
 */
export function isValidRole(role) {
  return ['system', 'user', 'assistant'].includes(role);
}

/**
 * Sanitiza conteúdo de mensagem
 * @param {string} content - Conteúdo da mensagem
 * @returns {string} Conteúdo sanitizado
 */
export function sanitizeMessageContent(content) {
  if (typeof content !== 'string') return '';
  return content.trim();
}

/**
 * Agrupa mensagens por modelo
 * @param {Array} messages - Todas as mensagens
 * @param {Array<string>} modelIds - IDs dos modelos
 * @returns {Object} Mapa de modelId -> mensagens
 */
export function groupMessagesByModel(messages, modelIds) {
  if (!Array.isArray(messages) || !Array.isArray(modelIds)) return {};
  
  const grouped = {};
  modelIds.forEach(modelId => {
    grouped[modelId] = getMessagesForModel(messages, modelId);
  });
  return grouped;
}