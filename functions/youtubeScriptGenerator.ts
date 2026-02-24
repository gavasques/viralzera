import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

/**
 * Backend function para gerar roteiro de YouTube
 * Envia prompt para um único modelo e retorna o texto completo
 */
Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const neon = createClientFromRequest(req);
    
    const user = await neon.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      prompt, 
      model,
      enableReasoning = false,
      reasoningEffort = 'medium',
      enableWebSearch = false
    } = body;

    if (!prompt?.trim()) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!model) {
      return Response.json({ error: 'Model is required' }, { status: 400 });
    }

    // Busca config do usuário para API key
    const userConfigs = await neon.entities.UserConfig.filter({});
    const userConfig = userConfigs[0];
    
    if (!userConfig?.openrouter_api_key) {
      return Response.json({ 
        error: 'API Key não configurada. Vá em Configurações para adicionar sua chave OpenRouter.' 
      }, { status: 400 });
    }

    console.log('[youtubeScriptGenerator] Starting generation with model:', model);

    // Prepara request body
    const requestBody = {
      model: model,
      messages: [
        { 
          role: 'system', 
          content: 'Você é um especialista em criação de roteiros para YouTube. Seu objetivo é criar roteiros magnéticos, envolventes e completos, prontos para serem gravados. Sempre siga a estrutura solicitada e escreva o texto palavra por palavra.'
        },
        { role: 'user', content: prompt.trim() }
      ],
    };

    // Adiciona reasoning se suportado
    if (enableReasoning && model.includes('claude')) {
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

    console.log('[youtubeScriptGenerator] Sending request to OpenRouter...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userConfig.openrouter_api_key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://neon.app',
        'X-Title': 'ContentAI YouTube Script Generator',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[youtubeScriptGenerator] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[youtubeScriptGenerator] OpenRouter error:', errorText);
      throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    console.log('[youtubeScriptGenerator] Content length:', content.length);
    console.log('[youtubeScriptGenerator] Duration:', duration, 'ms');

    // Log de uso
    await neon.entities.UsageLog.create({
      user_email: user.email,
      feature: 'youtube_script_generator',
      model: model,
      model_name: model.split('/')[1] || model,
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
      duration_ms: duration,
      success: true,
    });

    return Response.json({
      success: true,
      content: content,
      usage: {
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
      },
      duration: duration,
    });

  } catch (error) {
    console.error('[youtubeScriptGenerator] Error:', error.message);
    return Response.json({ 
      error: error.message || 'Erro ao gerar roteiro' 
    }, { status: 500 });
  }
});