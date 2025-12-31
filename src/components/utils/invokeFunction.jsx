/**
 * Utility to invoke backend functions directly via HTTP
 * Workaround for base44.functions.invoke issues
 */
export async function invokeFunction(functionName, payload = {}) {
  const response = await fetch(`/api/functions/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    credentials: 'include'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Function call failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Mimic the base44.functions.invoke response structure
  return { data };
}