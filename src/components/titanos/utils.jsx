/**
 * Utilitários para Multi Chat
 */

/**
 * Formata número de tokens para exibição
 */
export function formatTokens(tokens) {
  if (!tokens || tokens === 0) return '0';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

/**
 * Formata custo em USD
 */
export function formatCost(cost) {
  if (!cost || cost === 0) return '$0.00';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

/**
 * Formata duração em ms para exibição
 */
export function formatDuration(ms) {
  if (!ms || ms === 0) return '0s';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Extrai nome do modelo a partir do ID
 */
export function extractModelName(modelId) {
  if (!modelId) return 'Modelo';
  return modelId.split('/')[1] || modelId;
}

/**
 * Calcula métricas agregadas das mensagens
 */
export function calculateMetrics(messages) {
  let totalTokens = 0;
  let totalCost = 0;
  let totalDuration = 0;
  let responseCount = 0;

  messages.forEach(msg => {
    if (msg.role === 'assistant' && msg.metrics) {
      const usage = msg.metrics.usage || {};
      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      
      totalTokens += usage.total_tokens || (promptTokens + completionTokens) || 0;
      totalDuration += msg.metrics.duration || 0;
      responseCount++;
      
      // Estimativa de custo (valores médios)
      totalCost += (promptTokens * 0.000001) + (completionTokens * 0.000002);
    }
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
 */
export function getMessagesForModel(messages, modelId) {
  return messages
    .filter(m => m.role === 'user' || m.role === 'system' || m.model_id === modelId)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
}

/**
 * Obtém alias do modelo a partir da lista de modelos aprovados
 * @param {string} recordId - ID único do registro (não o model_id)
 * @param {Array} approvedModels - Lista de modelos aprovados
 */
export function getModelAlias(recordId, approvedModels = []) {
  // Busca pelo ID único do registro
  const approved = approvedModels.find(m => m.id === recordId);
  return approved?.alias || extractModelName(recordId);
}

/**
 * Obtém o model_id (ID do OpenRouter) a partir do ID único do registro
 * @param {string} recordId - ID único do registro
 * @param {Array} approvedModels - Lista de modelos aprovados
 */
export function getOpenRouterId(recordId, approvedModels = []) {
  const approved = approvedModels.find(m => m.id === recordId);
  return approved?.model_id || recordId;
}

/**
 * Obtém o registro completo do modelo aprovado
 * @param {string} recordId - ID único do registro
 * @param {Array} approvedModels - Lista de modelos aprovados
 */
export function getApprovedModel(recordId, approvedModels = []) {
  return approvedModels.find(m => m.id === recordId) || null;
}