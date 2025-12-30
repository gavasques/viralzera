import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backend function para chat com modelo único
 * Usado para regenerar respostas ou chat expandido
 */
Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      message, 
      conversationId, 
      modelId,
      history = [],
      saveUserMessage = true
    } = body;

    if (!message?.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!conversationId || !modelId) {
      return Response.json({ error: 'Conversation ID and Model ID are required' }, { status: 400 });
    }

    // Busca config do usuário
    const userConfigs = await base44.entities.UserConfig.filter({});
    const userConfig = userConfigs[0];
    
    if (!userConfig?.openrouter_api_key) {
      return Response.json({ 
        error: 'API Key não configurada' 
      }, { status: 400 });
    }

    // Salva mensagem do usuário se solicitado
    if (saveUserMessage) {
      await base44.entities.TitanosMessage.create({
        conversation_id: conversationId,
        role: 'user',
        content: message.trim(),
        model_id: null,
      });
    }

    // Prepara histórico
    const formattedHistory = history
      .filter(m => m.role && m.content)
      .map(m => ({ role: m.role, content: m.content }));

    const messagesPayload = [
      ...formattedHistory,
      { role: 'user', content: message.trim() },
    ];

    // Chama OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userConfig.openrouter_api_key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://base44.app',
        'X-Title': 'ContentAI Single Chat',
      },
      body: JSON.stringify({
        model: modelId,
        messages: messagesPayload,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error: ${errorText}`);
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    
    const assistantContent = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    // Salva resposta
    await base44.entities.TitanosMessage.create({
      conversation_id: conversationId,
      role: 'assistant',
      content: assistantContent,
      model_id: modelId,
      metrics: {
        duration,
        usage: {
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0,
          total_tokens: usage.total_tokens || 0,
        },
      },
    });

    // Log de uso
    await base44.entities.UsageLog.create({
      user_email: user.email,
      feature: 'titanos_chat',
      model: modelId,
      model_name: modelId.split('/')[1] || modelId,
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
      duration_ms: duration,
      success: true,
      session_id: conversationId,
    });

    return Response.json({
      success: true,
      content: assistantContent,
      duration,
      usage,
    });

  } catch (error) {
    console.error('TitanosChatSingle error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});