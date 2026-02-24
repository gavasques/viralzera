import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

/**
 * Função para analisar textos da modelagem usando OpenRouter
 * Gera resumo analítico com insights e tópicos-chave
 */
Deno.serve(async (req) => {
  try {
    const neon = createClientFromRequest(req);
    const user = await neon.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { textId, modeling_id } = await req.json();

    if (!textId || !modeling_id) {
      return Response.json({ 
        error: 'textId e modeling_id são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar texto
    const texts = await neon.entities.ModelingText.filter({ id: textId });
    const text = texts[0];
    
    if (!text || !text.content) {
      return Response.json({ 
        error: 'Texto não encontrado ou sem conteúdo' 
      }, { status: 404 });
    }

    // Buscar configuração do agente de análise de textos
    const configs = await neon.asServiceRole.entities.ModelingTextAnalyzerConfig.list();
    const config = configs[0];

    if (!config?.model) {
      return Response.json({ 
        error: 'Configure o agente de Análise de Textos em Configurações de Agentes' 
      }, { status: 400 });
    }

    // Buscar API key do usuário
    const userConfigs = await neon.asServiceRole.entities.UserConfig.filter({ 
      created_by: user.email 
    });
    const apiKey = userConfigs[0]?.openrouter_api_key;

    if (!apiKey) {
      return Response.json({ 
        error: 'Configure sua API Key do OpenRouter em Configurações' 
      }, { status: 400 });
    }

    // Preparar prompt
    const systemPrompt = config.prompt.replace(/\{\{text_content\}\}/g, text.content);

    // Chamar OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://app.neon.com',
        'X-Title': 'ContentAI - Text Analyzer'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Por favor, analise este texto:\n\n${text.content}` }
        ],
        temperature: 0.7,
        max_tokens: config.max_tokens || 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('Resposta inválida da API');
    }

    // Salvar análise
    const analysisRecord = await neon.asServiceRole.entities.ModelingAnalysis.create({
      modeling_id,
      material_id: textId,
      material_type: 'text',
      material_title: text.title,
      analysis_summary: analysis,
      character_count: analysis.length,
      token_estimate: Math.ceil(analysis.length / 4),
      status: 'completed',
      created_by: user.email
    });

    return Response.json({ 
      success: true, 
      analysisId: analysisRecord.id,
      analysis 
    });

  } catch (error) {
    console.error('Erro ao analisar texto:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});