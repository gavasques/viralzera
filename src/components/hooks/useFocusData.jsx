import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { useSelectedFocus, FOCUS_QUERY_KEYS } from "@/components/hooks/useSelectedFocus";

/**
 * Custom hook for fetching focus-related data with common patterns
 * Reduces boilerplate across pages
 * 
 * @param {string} entityName - Name of the entity
 * @param {string} queryKey - Unique query key
 * @param {object} options - Additional query options
 */
export function useFocusData(entityName, queryKey, options = {}) {
  const { selectedFocusId, isLoading: isLoadingFocus } = useSelectedFocus();
  const { 
    sortBy = '-created_date', 
    limit = 100,
    additionalFilters = {},
    enabled = true 
  } = options;

  const entity = neon.entities[entityName];

  const query = useQuery({
    queryKey: [queryKey, selectedFocusId],
    queryFn: async () => {
      if (!selectedFocusId) return [];
      return entity.filter(
        { focus_id: selectedFocusId, ...additionalFilters }, 
        sortBy, 
        limit
      );
    },
    enabled: !!selectedFocusId && enabled,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    gcTime: 0, // Don't cache old focus data
  });

  return {
    data: query.data || [],
    isLoading: isLoadingFocus || query.isLoading,
    error: query.error,
    refetch: query.refetch,
    selectedFocusId,
    hasFocus: !!selectedFocusId
  };
}

/**
 * Hook for fetching user-specific configuration data
 * @deprecated API keys are now centralized in backend secrets
 */
export function useUserConfig() {
  return useQuery({
    queryKey: ['userConfig'],
    queryFn: async () => {
      const user = await neon.auth.me();
      const configs = await neon.entities.UserConfig.filter({ created_by: user.email });
      return configs[0] || null;
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}