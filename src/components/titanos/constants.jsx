
/**
 * Constantes centralizadas para Multi Chat
 */

// Query Keys - centralizados para consistência de cache
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

// Stale Times - quando o cache é considerado "antigo"
export const STALE_TIMES = {
  USER: 5 * 60 * 1000,        // 5 min - dados do usuário mudam raramente
  MODELS: 2 * 60 * 1000,      // 2 min - modelos aprovados
  GROUPS: 5 * 60 * 1000,      // 5 min - grupos mudam pouco
  CONVERSATIONS: 30 * 1000,   // 30s - lista de conversas
  MESSAGES: 5 * 1000,         // 5s - mensagens precisam ser mais frescas
  PROMPTS: 5 * 60 * 1000,     // 5 min - prompts salvos
};

// Limites
export const DEFAULT_CONVERSATION_LIMIT = 50;
export const MAX_MODELS_PER_CONVERSATION = 6;
export const MAX_INPUT_LENGTH = 100000; // 100k caracteres
export const MAX_SYSTEM_PROMPT_LENGTH = 10000; // 10k caracteres
export const MAX_TITLE_LENGTH = 200;

// Níveis de Reasoning
export const REASONING_LEVELS = [
  { value: 'low', label: 'Baixo - Respostas mais rápidas' },
  { value: 'medium', label: 'Médio - Balanceado' },
  { value: 'high', label: 'Alto - Raciocínio profundo' },
];

// Timeouts
export const API_TIMEOUT_MS = 120000; // 2 min
export const API_KEY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
