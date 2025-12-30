import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backend function para Multi Chat
 * Envia mensagem para múltiplos modelos em paralelo
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
      selectedModels = [], 
      history = [],
      enableReasoning = false,
      reasoningEffort = 'high',
      enableWebSearch = false
    } = body;

    if (!message?.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!conversationId) {
      return Response.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    if (selectedModels.length === 0) {
      return Response.json({ error: 'At least one model is required' }, { status: 400 });
    }

    // Busca config do usuário para API key
    const userConfigs = await base44.entities.UserConfig.filter({});
    const userConfig = userConfigs[0];
    
    if (!userConfig?.openrouter_api_key) {
      return Response.json({ 
        error: 'API Key não configurada. Vá em Configurações para adicionar sua chave OpenRouter.' 
      }, { status: 400 });
    }

    // Salva mensagem do usuário
    await base44.entities.TitanosMessage.create({
      conversation_id: conversationId,
      role: 'user',
      content: message.trim(),
      model_id: null,
    });

    // Prepara histórico para OpenRouter
    const formattedHistory = history
      .filter(m => m.role && m.content)
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    // Adiciona mensagem atual
    const messagesPayload = [
      ...formattedHistory,
      { role: 'user', content: message.trim() },
    ];

    // Envia para todos os modelos em paralelo
    const responses = await Promise.allSettled(
      selectedModels.map(async (modelId) => {
        const modelStart = Date.now();
        
        try {
          const requestBody = {
            model: modelId,
            messages: messagesPayload,
          };

          // Adiciona reasoning se suportado
          if (enableReasoning && modelId.includes('claude')) {
            requestBody.include_reasoning = true;
            
            const effortMap = {
              'low': { budget_tokens: 1024 },
              'medium': { budget_tokens: 5000 },
              'high': { budget_tokens: 10000 },
            };
            requestBody.reasoning = effortMap[reasoningEffort] || effortMap.high;
          }

          // Adiciona web search se habilitado
          if (enableWebSearch) {
            requestBody.plugins = [{ id: 'web' }];
          }

          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${userConfig.openrouter_api_key}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://base44.app',
              'X-Title': 'ContentAI Multi Chat',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
          }

          const data = await response.json();
          const duration = Date.now() - modelStart;
          
          const assistantContent = data.choices?.[0]?.message?.content || '';
          const usage = data.usage || {};

          // Salva resposta do modelo
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

          return { modelId, success: true, duration };
        } catch (error) {
          console.error(`Error for model ${modelId}:`, error);
          
          // Salva mensagem de erro
          await base44.entities.TitanosMessage.create({
            conversation_id: conversationId,
            role: 'assistant',
            content: `Erro ao processar: ${error.message}`,
            model_id: modelId,
            metrics: { error: true },
          });

          return { modelId, success: false, error: error.message };
        }
      })
    );

    const totalDuration = Date.now() - startTime;
    const successCount = responses.filter(r => r.status === 'fulfilled' && r.value?.success).length;

    return Response.json({
      success: true,
      processed: successCount,
      total: selectedModels.length,
      duration: totalDuration,
    });

  } catch (error) {
    console.error('TitanosChat error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});