import { useState, useEffect, useCallback, useRef } from 'react';
import { neon } from "@/api/neonClient";
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
  const [isInitializing, setIsInitializing] = useState(true);
  const autoSelectRan = useRef(false);

  // Fetch user data to get saved focus
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: FOCUS_QUERY_KEYS.USER,
    queryFn: () => neon.auth.me(),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // Fetch all focuses
  const { data: allFocuses = [], isLoading: isLoadingFocuses, isFetched } = useQuery({
    queryKey: FOCUS_QUERY_KEYS.LIST,
    queryFn: () => neon.entities.Focus.list('-created_date', 50),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // The selected focus ID comes strictly from user data (with optimistic query updates)
  const selectedFocusId = user?.selected_focus_id || null;

  // Mutation to save focus to user
  const saveFocusMutation = useMutation({
    mutationFn: async (focusId) => {
      await neon.auth.updateMe({ selected_focus_id: focusId });
      return focusId;
    },
    onMutate: async (newFocusId) => {
      await queryClient.cancelQueries({ queryKey: FOCUS_QUERY_KEYS.USER });
      const previousUser = queryClient.getQueryData(FOCUS_QUERY_KEYS.USER);

      // Optimistically update to the new value
      queryClient.setQueryData(FOCUS_QUERY_KEYS.USER, (old) => {
        if (!old) return old;
        return { ...old, selected_focus_id: newFocusId };
      });

      return { previousUser };
    },
    onSuccess: () => {
      window.dispatchEvent(new Event('focus-change'));
    },
    onError: (err, newFocusId, context) => {
      // Revert optimistic update on error
      if (context?.previousUser) {
        queryClient.setQueryData(FOCUS_QUERY_KEYS.USER, context.previousUser);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: FOCUS_QUERY_KEYS.USER });
    }
  });

  // Set focus function
  const setFocus = useCallback((id) => {
    if (!id || id === selectedFocusId) {
      return;
    }
    saveFocusMutation.mutate(id);
  }, [selectedFocusId, saveFocusMutation]);

  // Refresh focuses list (call after create/update/delete)
  const refreshFocuses = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: FOCUS_QUERY_KEYS.LIST });
  }, [queryClient]);

  // Clear selection (useful after delete)
  const clearSelection = useCallback(() => {
    queryClient.setQueryData(FOCUS_QUERY_KEYS.USER, (old) => {
      if (!old) return old;
      return { ...old, selected_focus_id: null };
    });
  }, [queryClient]);

  // Auto-select first focus if none selected or current doesn't exist
  useEffect(() => {
    // Wait for initial data load to complete before making decisions
    if (!isFetched || isLoadingUser || isLoadingFocuses) return;

    // Ensure we only run initialization logic once per session/refresh
    if (!isInitializing && autoSelectRan.current) return;

    // No focuses exist
    if (allFocuses.length === 0) {
      if (selectedFocusId) {
        clearSelection();
      }
      setIsInitializing(false);
      autoSelectRan.current = true;
      return;
    }

    const focusExists = selectedFocusId ? allFocuses.some(f => f.id === selectedFocusId) : false;

    // Auto-select first focus if none selected or selected doesn't exist
    if (!selectedFocusId || !focusExists) {
      autoSelectRan.current = true;
      setIsInitializing(false);

      // Delay setFocus to avoid React state dispatch mid-render
      setTimeout(() => setFocus(allFocuses[0].id), 0);
    } else {
      // Valid focus exists and is selected
      setIsInitializing(false);
      autoSelectRan.current = true;
    }
  }, [allFocuses, selectedFocusId, isFetched, isLoadingUser, isLoadingFocuses, setFocus, clearSelection, isInitializing]);

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