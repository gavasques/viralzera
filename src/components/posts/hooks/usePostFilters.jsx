import { useState, useMemo, useCallback } from 'react';
import { DEFAULT_FILTERS } from '../constants';

export function usePostFilters(posts = []) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          post.title?.toLowerCase().includes(searchLower) || 
          post.content?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.status !== 'all' && post.status !== filters.status) return false;
      if (filters.post_type_id !== 'all' && post.post_type_id !== filters.post_type_id) return false;
      if (filters.platform !== 'all' && post.platform !== filters.platform) return false;
      
      if (!filters.show_completed && post.is_completed) return false;

      return true;
    });
  }, [posts, filters]);

  const getPostsByStatus = useCallback((status) => {
    return filteredPosts.filter(p => p.status === status);
  }, [filteredPosts]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.search ||
      filters.status !== 'all' ||
      filters.post_type_id !== 'all' ||
      filters.platform !== 'all' ||
      filters.show_completed;
  }, [filters]);

  return {
    filters,
    setFilters,
    filteredPosts,
    getPostsByStatus,
    clearFilters,
    hasActiveFilters
  };
}