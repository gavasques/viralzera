import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access listModels
    const { action } = await req.clone().json();
    if (action === 'listModels' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { action } = body;

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      return Response.json({ 
        error: 'OPENROUTER_API_KEY não configurada' 
      }, { status: 500 });
    }

    // List models action
    if (action === 'listModels') {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return Response.json({ 
          error: `OpenRouter API error: ${response.status}`,
          details: errorText
        }, { status: response.status });
      }

      const data = await response.json();
      return Response.json({ models: data.data || [] });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('OpenRouter function error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error',
      stack: error.stack
    }, { status: 500 });
  }
});