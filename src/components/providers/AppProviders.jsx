import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a single QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Centralized providers for the entire application
 * Ensures all context providers are properly initialized
 */
export default function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}