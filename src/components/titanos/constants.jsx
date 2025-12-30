/**
 * Constantes centralizadas para Multi Chat
 */

/**
 * Query Keys para React Query
 * Uso de factory functions para keys dinâmicas
 */
export const TITANOS_QUERY_KEYS = {
  USER: ['titanos-user'],
  APPROVED_MODELS: ['titanos-approved-models'],
  GROUPS: ['titanos-groups'],
  CONVERSATIONS: (limit) => ['titanos-conversations', limit],
  CONVERSATION: (id) => ['titanos-conversation', id],
  MESSAGES: (id) => ['titanos-messages', id],
  CONVERSATION_VOTES: (id) => ['titanos-votes', id],
  PROMPTS: ['titanos-prompts'],
};

/**
 * Tempos de cache (staleTime) em ms
 */
export const STALE_TIMES = {
  USER: 5 * 60 * 1000, // 5 min
  MODELS: 60 * 1000, // 1 min
  GROUPS: 5 * 60 * 1000, // 5 min
  CONVERSATIONS: 30 * 1000, // 30s
  MESSAGES: 10 * 1000, // 10s
  PROMPTS: 5 * 60 * 1000, // 5 min
};

/**
 * Limites de paginação
 */
export const DEFAULT_CONVERSATION_LIMIT = 50;
export const MAX_MODELS_PER_CONVERSATION = 6;

/**
 * Níveis de reasoning
 */
export const REASONING_LEVELS = [
  { value: 'low', label: 'Baixo - Respostas mais rápidas' },
  { value: 'medium', label: 'Médio - Balanceado' },
  { value: 'high', label: 'Alto - Raciocínio profundo' },
];

/**
 * Roles válidos para mensagens
 */
export const VALID_MESSAGE_ROLES = ['system', 'user', 'assistant'];

/**
 * Configuração de retry para chamadas API
 */
export const API_RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1000,
  retryableStatuses: [429, 500, 502, 503, 504],
};

/**
 * Modelos que suportam reasoning
 */
export const REASONING_SUPPORTED_MODELS = ['claude', 'o1', 'deepseek-r1'];