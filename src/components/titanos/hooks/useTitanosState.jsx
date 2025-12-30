/**
 * Hook centralizado para estado do Multi Chat
 * Responsável por gerenciar todo o estado local da página
 */

import { useState, useCallback } from 'react';
import { DEFAULT_CONVERSATION_LIMIT } from '../constants';

/**
 * Estado inicial do Multi Chat
 */
const INITIAL_STATE = {
  input: '',
  activeConversationId: null,
  isNewModalOpen: false,
  isTypeSelectorOpen: false,
  isMultiScriptOpen: false,
  newConversationGroup: null,
  removeModelTarget: null,
  expandedModel: null,
  limit: DEFAULT_CONVERSATION_LIMIT,
};

/**
 * Hook para gerenciar estado do Multi Chat
 */
export function useTitanosState() {
  // Input state
  const [input, setInput] = useState(INITIAL_STATE.input);
  
  // Active conversation
  const [activeConversationId, setActiveConversationId] = useState(INITIAL_STATE.activeConversationId);
  
  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(INITIAL_STATE.isNewModalOpen);
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(INITIAL_STATE.isTypeSelectorOpen);
  const [isMultiScriptOpen, setIsMultiScriptOpen] = useState(INITIAL_STATE.isMultiScriptOpen);
  
  // Group for new conversation
  const [newConversationGroup, setNewConversationGroup] = useState(INITIAL_STATE.newConversationGroup);
  
  // Model removal target
  const [removeModelTarget, setRemoveModelTarget] = useState(INITIAL_STATE.removeModelTarget);
  
  // Expanded model for single chat modal
  const [expandedModel, setExpandedModel] = useState(INITIAL_STATE.expandedModel);
  
  // Pagination limit
  const [limit, setLimit] = useState(INITIAL_STATE.limit);

  // Modal controls
  const openTypeSelector = useCallback(() => {
    setNewConversationGroup(null);
    setIsTypeSelectorOpen(true);
  }, []);

  const openNewModal = useCallback((group = null) => {
    setNewConversationGroup(group);
    setIsNewModalOpen(true);
  }, []);

  const closeNewModal = useCallback(() => {
    setIsNewModalOpen(false);
  }, []);

  const closeTypeSelector = useCallback(() => {
    setIsTypeSelectorOpen(false);
  }, []);

  const openMultiScript = useCallback(() => {
    setIsMultiScriptOpen(true);
  }, []);

  const closeMultiScript = useCallback(() => {
    setIsMultiScriptOpen(false);
  }, []);

  // Expanded model controls
  const openExpandedModel = useCallback((modelId) => {
    setExpandedModel(modelId);
  }, []);

  const closeExpandedModel = useCallback(() => {
    setExpandedModel(null);
  }, []);

  // Remove model controls
  const requestRemoveModel = useCallback((modelId) => {
    setRemoveModelTarget(modelId);
  }, []);

  const cancelRemoveModel = useCallback(() => {
    setRemoveModelTarget(null);
  }, []);

  // Pagination
  const loadMore = useCallback(() => {
    setLimit(prev => prev + 50);
  }, []);

  // Input controls
  const clearInput = useCallback(() => {
    setInput('');
  }, []);

  const restoreInput = useCallback((value) => {
    setInput(value);
  }, []);

  return {
    // State
    input,
    activeConversationId,
    isNewModalOpen,
    isTypeSelectorOpen,
    isMultiScriptOpen,
    newConversationGroup,
    removeModelTarget,
    expandedModel,
    limit,

    // Setters
    setInput,
    setActiveConversationId,

    // Modal controls
    openTypeSelector,
    openNewModal,
    closeNewModal,
    closeTypeSelector,
    openMultiScript,
    closeMultiScript,

    // Expanded model
    openExpandedModel,
    closeExpandedModel,

    // Remove model
    requestRemoveModel,
    cancelRemoveModel,

    // Pagination
    loadMore,

    // Input
    clearInput,
    restoreInput,
  };
}