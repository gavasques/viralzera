import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "69405b4dfc2b80b38d51b395", 
  requiresAuth: true // Ensure authentication is required for all operations
});
