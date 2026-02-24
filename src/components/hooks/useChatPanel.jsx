import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { sendMessage } from '@/components/chat/OpenRouterService';
import { toast } from "sonner";

/**
 * Unified hook for chat panel logic
 * Eliminates duplication across AudienceChatPanel, PersonaChatPanel, ProductChatPanel
 * 
 * @param {Object} options
 * @param {Object} options.session - Current chat session
 * @param {Function} options.onUpdateSession - Callback to update session
 * @param {string} options.focusId - Current focus ID
 * @param {string} options.configEntity - Entity name for config (e.g., 'AudienceConfig')
 * @param {string} options.configQueryKey - Query key for config
 * @param {string} options.feature - Feature name for usage logging
 * @param {Function} options.buildSystemPrompt - Function to build system prompt from config
 */
export function useChatPanel({
  session,
  onUpdateSession,
  focusId,
  configEntity,
  configQueryKey,
  feature,
  buildSystemPrompt
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isReasoning, setIsReasoning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef(null);

  // Fetch config (global - single record for all users)
  const { data: config } = useQuery({
    queryKey: configQueryKey,
    queryFn: async () => {
      const configs = await neon.entities[configEntity].list('-created_date', 1);
      return configs[0] || null;
    },
    staleTime: 60000
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages?.length, isLoading]);

  // Send message handler
  const handleSend = useCallback(async (message, files = []) => {
    if (!session) return;

    const model = config?.model || 'openai/gpt-4o-mini';
    const enableReasoning = config?.enable_reasoning || false;
    const reasoningEffort = config?.reasoning_effort || 'medium';
    const enableWebSearch = config?.enable_web_search || false;

    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      files: files.length > 0 ? files.map(f => ({ name: f.name, url: f.url })) : undefined
    };

    const updatedMessages = [...(session.messages || []), userMessage];
    onUpdateSession({ ...session, messages: updatedMessages });

    setIsLoading(true);
    if (enableReasoning) setIsReasoning(true);
    if (enableWebSearch) setIsSearching(true);

    try {
      // Build system prompt using provided function
      const systemPrompt = buildSystemPrompt ? buildSystemPrompt(config) : (config?.prompt || '');
      
      const apiMessages = [];
      if (systemPrompt) {
        apiMessages.push({ role: 'system', content: systemPrompt });
      }
      
      updatedMessages.forEach(msg => {
        apiMessages.push({ role: msg.role, content: msg.content });
      });

      const response = await sendMessage({
        model,
        messages: apiMessages,
        options: {
          enableReasoning,
          reasoningEffort,
          enableWebSearch,
          files,
          maxTokens: 4000,
          feature,
          modelName: config?.model_name || model,
          sessionId: session?.id,
          focusId
        }
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        usage: response.usage,
        citations: response.citations
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const totalTokens = (session.total_tokens || 0) + (response.usage?.totalTokens || 0);
      
      onUpdateSession({ 
        ...session, 
        messages: finalMessages,
        total_tokens: totalTokens
      });

    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
      setIsReasoning(false);
      setIsSearching(false);
    }
  }, [session, config, onUpdateSession, buildSystemPrompt, feature, focusId]);

  return {
    // State
    isLoading,
    isReasoning,
    isSearching,
    scrollRef,
    config,
    messages: session?.messages || [],
    
    // Actions
    handleSend
  };
}