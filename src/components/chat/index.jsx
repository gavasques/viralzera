
// Export all chat components
export { default as ChatMessage } from './ChatMessage';
export { default as ChatInput } from './ChatInput';
export { default as ChatSidebar } from './ChatSidebar';
export { default as ChatLoadingIndicator } from './ChatLoadingIndicator';
export { default as ChatEmptyState } from './ChatEmptyState';
export { default as ChatHeader } from './ChatHeader';
export { default as ChatSettingsModal } from './ChatSettingsModal';
export { default as SaveFromChatButton } from './SaveFromChatButton';

// Export JSON extraction utilities
export {
  extractJsonFromContent,
  detectJsonType,
  normalizeAudienceData,
  normalizePersonaData,
  normalizeProductData
} from './useJsonExtractor';

// Export OpenRouter service
export {
  sendMessage,
  supportsReasoning,
  hasNativeWebSearch
} from './OpenRouterService';

export { default as OpenRouterService } from './OpenRouterService';
