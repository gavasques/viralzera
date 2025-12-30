/**
 * Utilitários para Multi Chat
 * Funções puras e reutilizáveis
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
 * @param {string} modelId - ID completo do modelo (ex: openai/gpt-4)
 * @returns {string} Nome simplificado
 */
export function extractModelName(modelId) {
  if (!modelId || typeof modelId !== 'string') return 'Modelo';
  const parts = modelId.split('/');
  return parts[1] || modelId;
}

/**
 * Calcula métricas agregadas das mensagens
 * @param {Array} messages - Lista de mensagens
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

  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.metrics) {
      const metrics = msg.metrics;
      const promptTokens = metrics.prompt_tokens || 0;
      const completionTokens = metrics.completion_tokens || 0;
      
      totalTokens += metrics.total_tokens || (promptTokens + completionTokens) || 0;
      totalDuration += metrics.duration_ms || metrics.duration || 0;
      responseCount++;
      
      // Estimativa de custo (valores médios de mercado)
      totalCost += (promptTokens * 0.000001) + (completionTokens * 0.000002);
    }
  }

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
 * Retorna mensagens do usuário, sistema e do modelo especificado
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
 * Agrupa mensagens por modelo
 * @param {Array} messages - Lista de mensagens
 * @returns {Object} Mensagens agrupadas por model_id
 */
export function groupMessagesByModel(messages) {
  if (!Array.isArray(messages)) return {};
  
  return messages.reduce((acc, msg) => {
    const key = msg.model_id || 'user';
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});
}

/**
 * Conta mensagens por tipo
 * @param {Array} messages - Lista de mensagens
 * @returns {Object} Contagem por role
 */
export function countMessagesByRole(messages) {
  if (!Array.isArray(messages)) return { user: 0, assistant: 0, system: 0 };
  
  return messages.reduce((acc, msg) => {
    acc[msg.role] = (acc[msg.role] || 0) + 1;
    return acc;
  }, { user: 0, assistant: 0, system: 0 });
}