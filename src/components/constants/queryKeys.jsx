/**
 * Centralized Query Keys for React Query
 * Ensures consistency across the application
 */

export const QUERY_KEYS = {
  // Approved Models
  APPROVED_MODELS: 'approvedModels',

  // User & Auth
  USER: ['currentUser'],
  USER_FOCUS: ['currentUserFocus'],
  USER_CONFIG: ['userConfig'],

  // Focus
  FOCUS: {
    LIST: ['focuses_list'],
    SINGLE: (id) => ['focus', id],
  },

  // Entities by Focus
  AUDIENCES: (focusId) => ['audiences', focusId],
  PERSONAS: (focusId) => ['personas', focusId],
  PRODUCTS: (focusId) => ['products', focusId],
  THEMES: (focusId) => ['themes', focusId],
  POST_TYPES: (focusId) => ['postTypes', focusId],
  MATERIALS: (focusId) => ['materials', focusId],
  TRENDS: (focusId) => ['trends', focusId],
  CANVAS: (focusId) => ['canvas', focusId],
  DNA_CONTENTS: (focusId) => ['dnaContents', focusId],
  DNA_PROFILES: (focusId) => ['dnaProfiles', focusId],

  // Chat Sessions
  CHATS: {
    AUDIENCE: (focusId, limit) => ['audienceChats', focusId, limit],
    PERSONA: (focusId, limit) => ['personaChats', focusId, limit],
    PRODUCT: (focusId, limit) => ['productChats', focusId, limit],
    SCRIPT: (focusId, limit) => ['scriptChats', focusId, limit],
  },

  // Global Configs (admin settings)
  CONFIGS: {
    AUDIENCE: ['audienceConfig', 'global'],
    PERSONA: ['personaConfig', 'global'],
    PRODUCT: ['productConfig', 'global'],
    SCRIPT: ['scriptConfig', 'global'],
    DNA: ['dnaConfig', 'global'],
    DNA_CONTENT: ['dnaContentConfig', 'global'],
    TREND: ['trendConfig', 'global'],
    MATERIAL_BANK: ['materialBankConfig', 'global'],
    POST_TYPE: ['postTypeConfig', 'global'],
  },

  // Titanos
  TITANOS: {
    CONVERSATIONS: (focusId) => ['titanosConversations', focusId],
    MESSAGES: (conversationId) => ['titanosMessages', conversationId],
    GROUPS: ['titanosGroups'],
  },

  // Models
  OPENROUTER_MODELS: ['openrouterModels'],

  // Dashboard
  DASHBOARD: (focusId) => ['dashboard', focusId],

  // Prompts
  PROMPTS: (focusId) => ['prompts', focusId],
};

/**
 * Feature identifiers for usage logging
 */
export const FEATURES = {
  AUDIENCE_CHAT: 'audience_chat',
  PERSONA_CHAT: 'persona_chat',
  PRODUCT_CHAT: 'product_chat',
  SCRIPT_CHAT: 'script_chat',
  TRENDS_SEARCH: 'trends_search',
  DNA_TRANSCRIBE: 'dna_transcribe',
  DNA_ANALYZE: 'dna_analyze',
  DNA_GENERATE: 'dna_generate',
  TITANOS_CHAT: 'titanos_chat',
  PDF_IMPORT: 'pdf_import',
  OPENROUTER_CHAT: 'openrouter_chat',
  REFINE_PROMPT: 'refine_prompt',
};

/**
 * Entity names for SDK calls
 */
export const ENTITIES = {
  FOCUS: 'Focus',
  AUDIENCE: 'Audience',
  AUDIENCE_GROUP: 'AudienceGroup',
  PERSONA: 'Persona',
  PRODUCT: 'Product',
  THEME: 'Theme',
  POST_TYPE: 'PostType',
  MATERIAL: 'Material',
  TREND: 'Trend',
  CANVAS: 'Canvas',
  DNA_CONTENT: 'DNAContent',
  DNA_PROFILE: 'DNAProfile',
  
  // Chats
  AUDIENCE_CHAT: 'AudienceChat',
  PERSONA_CHAT: 'PersonaChat',
  PRODUCT_CHAT: 'ProductChat',
  SCRIPT_CHAT: 'ScriptChat',
  
  // Configs
  AUDIENCE_CONFIG: 'AudienceConfig',
  PERSONA_CONFIG: 'PersonaConfig',
  PRODUCT_CONFIG: 'ProductConfig',
  SCRIPT_CONFIG: 'ScriptConfig',
  DNA_CONFIG: 'DNAConfig',
  DNA_CONTENT_CONFIG: 'DNAContentConfig',
  TREND_CONFIG: 'TrendConfig',
  MATERIAL_BANK_CONFIG: 'MaterialBankConfig',
  POST_TYPE_CONFIG: 'PostTypeConfig',
  
  // Titanos
  TITANOS_CONVERSATION: 'TitanosConversation',
  TITANOS_MESSAGE: 'TitanosMessage',
  TITANOS_GROUP: 'TitanosChatGroup',
  
  // User
  USER: 'User',
  USER_CONFIG: 'UserConfig',
  USAGE_LOG: 'UsageLog',
  PROMPT: 'Prompt',
};