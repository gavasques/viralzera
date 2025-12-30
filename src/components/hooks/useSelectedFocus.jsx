import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'selectedFocusId';

export function useSelectedFocus() {
  const [selectedFocusId, setSelectedFocusId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || null;
  });

  const { data: focuses = [] } = useQuery({
    queryKey: ['focuses'],
    queryFn: () => base44.entities.Focus.list('-created_date'),
  });

  const currentFocus = focuses.find(f => f.id === selectedFocusId) || null;

  const selectFocus = (focusId) => {
    setSelectedFocusId(focusId);
    if (focusId) {
      localStorage.setItem(STORAGE_KEY, focusId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Auto-select first focus if none selected
  useEffect(() => {
    if (!selectedFocusId && focuses.length > 0) {
      selectFocus(focuses[0].id);
    }
  }, [focuses, selectedFocusId]);

  return {
    selectedFocusId,
    currentFocus,
    focuses,
    selectFocus,
  };
}