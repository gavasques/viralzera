import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from '@/components/constants/queryKeys';

// Re-export for backwards compatibility
export const FOCUS_QUERY_KEYS = {
  USER: QUERY_KEYS.USER_FOCUS,
  LIST: QUERY_KEYS.FOCUS.LIST,
  SINGLE: QUERY_KEYS.FOCUS.SINGLE,
};

/**
 * Hook to manage selected focus - persisted in User entity for reliability
 * Handles: selection, auto-selection fallback, cache invalidation on CRUD
 */
export function useSelectedFocus() {
  const queryClient = useQueryClient();
  const [localFocusId, setLocalFocusId] = useState(null);
  const autoSelectRan = useRef(false);

  // Fetch user data to get saved focus
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: FOCUS_QUERY_KEYS.USER,
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // Fetch all focuses
  const { data: allFocuses = [], isLoading: isLoadingFocuses, isFetched } = useQuery({
    queryKey: FOCUS_QUERY_KEYS.LIST,
    queryFn: () => base44.entities.Focus.list('-created_date', 50),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // The selected focus ID comes from local state (optimistic) or user data
  const selectedFocusId = localFocusId || user?.selected_focus_id || null;

  // Mutation to save focus to user
  const saveFocusMutation = useMutation({
    mutationFn: async (focusId) => {
      await base44.auth.updateMe({ selected_focus_id: focusId });
      return focusId;
    },
    onSuccess: (focusId) => {
      queryClient.setQueryData(FOCUS_QUERY_KEYS.USER, (old) => ({
        ...old,
        selected_focus_id: focusId
      }));
      setLocalFocusId(null);
      window.dispatchEvent(new Event('focus-change'));
    },
    onError: () => {
      setLocalFocusId(null); // Revert optimistic update on error
    }
  });

  // Set focus function with optimistic update
  const setFocus = useCallback((id) => {
    if (id === selectedFocusId) return;
    setLocalFocusId(id);
    saveFocusMutation.mutate(id);
  }, [selectedFocusId, saveFocusMutation]);

  // Refresh focuses list (call after create/update/delete)
  const refreshFocuses = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: FOCUS_QUERY_KEYS.LIST });
  }, [queryClient]);

  // Clear selection (useful after delete)
  const clearSelection = useCallback(() => {
    setLocalFocusId(null);
    queryClient.setQueryData(FOCUS_QUERY_KEYS.USER, (old) => ({
      ...old,
      selected_focus_id: null
    }));
  }, [queryClient]);

  // Auto-select first focus if none selected or current doesn't exist
  useEffect(() => {
    if (!isFetched || isLoadingUser || isLoadingFocuses) return;
    
    // No focuses exist
    if (allFocuses.length === 0) {
      if (selectedFocusId) {
        clearSelection();
      }
      return;
    }

    const focusExists = allFocuses.some(f => f.id === selectedFocusId);
    
    // Auto-select first focus if none selected or selected doesn't exist
    if (!selectedFocusId || !focusExists) {
      if (!autoSelectRan.current || !focusExists) {
        autoSelectRan.current = true;
        setFocus(allFocuses[0].id);
      }
    }
  }, [allFocuses, selectedFocusId, isFetched, isLoadingUser, isLoadingFocuses, setFocus, clearSelection]);

  // Reset autoSelectRan when focuses list changes significantly
  useEffect(() => {
    autoSelectRan.current = false;
  }, [allFocuses.length]);

  // Get current focus object
  const currentFocus = allFocuses.find(f => f.id === selectedFocusId) || null;

  return {
    selectedFocusId,
    setFocus,
    currentFocus,
    isLoading: isLoadingUser || isLoadingFocuses,
    allFocuses,
    refreshFocuses,
    clearSelection
  };
}