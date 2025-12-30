/**
 * Constantes centralizadas para Multi Chat
 * Single source of truth para configurações
 */

// Query Keys (funções para keys dinâmicas)
export const TITANOS_QUERY_KEYS = {
  USER: ['titanos-user'],
  APPROVED_MODELS: ['titanos-approved-models'],
  GROUPS: ['titanos-groups'],
  CONVERSATIONS: (limit) => ['titanos-conversations', limit],
  CONVERSATION: (id) => ['titanos-conversation', id],
  MESSAGES: (id) => ['titanos-messages', id],
  CONVERSATION_VOTES: (id) => ['titanos-votes', id],
  PROMPTS: ['titanos-prompts'],
  API_KEY: ['user-openrouter-api-key'],
};

// Tempos de cache (stale times)
export const STALE_TIMES = {
  USER: 5 * 60 * 1000,         // 5 min - dados do usuário mudam raramente
  MODELS: 60 * 1000,           // 1 min - modelos podem ser atualizados
  GROUPS: 5 * 60 * 1000,       // 5 min - grupos mudam pouco
  CONVERSATIONS: 30 * 1000,    // 30s - conversas podem ser criadas
  MESSAGES: 0,                 // Sempre buscar dados frescos
  PROMPTS: 5 * 60 * 1000,      // 5 min
  API_KEY: 5 * 60 * 1000,      // 5 min
};

// Limites
export const LIMITS = {
  DEFAULT_CONVERSATIONS: 50,
  CONVERSATIONS_PAGE_SIZE: 50,
  MAX_MODELS_PER_CONVERSATION: 6,
  MAX_MESSAGE_LENGTH: 50000,
  MAX_HISTORY_MESSAGES: 50,
};

// Alias para compatibilidade
export const DEFAULT_CONVERSATION_LIMIT = LIMITS.DEFAULT_CONVERSATIONS;
export const MAX_MODELS_PER_CONVERSATION = LIMITS.MAX_MODELS_PER_CONVERSATION;

// Níveis de reasoning
export const REASONING_LEVELS = [
  { value: 'low', label: 'Baixo - Respostas mais rápidas' },
  { value: 'medium', label: 'Médio - Balanceado' },
  { value: 'high', label: 'Alto - Raciocínio profundo' },
];

// Erros
export const ERROR_MESSAGES = {
  NO_API_KEY: 'Configure sua API Key do OpenRouter em Configurações',
  INVALID_API_KEY: 'API Key inválida. Verifique suas configurações.',
  RATE_LIMITED: 'Limite de requisições atingido. Aguarde um momento.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  TIMEOUT: 'Timeout na requisição. Tente novamente.',
  GENERIC: 'Ocorreu um erro. Tente novamente.',
};

// Status de mensagem
export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  ERROR: 'error',
};