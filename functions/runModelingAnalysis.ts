import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { modeling_id, material_id, material_type, material_title, content } = await req.json();

    if (!modeling_id || !material_id || !material_type || !content) {
      return Response.json({ 
        error: 'Campos obrigatórios: modeling_id, material_id, material_type, content' 
      }, { status: 400 });
    }

    // Buscar configuração do agente
    const analyzerConfigs = await base44.entities.ModelingAnalyzerConfig.list();
    const config = analyzerConfigs?.[0];

    if (!config?.model) {
      return Response.json({ 
        error: 'Configure o modelo de análise em Configurações de Agentes > Lab de Ideias - Analisador Individual' 
      }, { status: 400 });
    }

    const systemPrompt = config.prompt || 'Analise o conteúdo fornecido e crie um resumo estruturado.';

    // Buscar API key do usuário
    const userConfigs = await base44.entities.UserConfig.list();
    const apiKey = userConfigs[0]?.openrouter_api_key;

    if (!apiKey) {
      return Response.json({ 
        error: 'Configure sua API Key do OpenRouter em Configurações' 
      }, { status: 400 });
    }

    // Criar ou atualizar registro de análise
    const existingAnalyses = await base44.entities.ModelingAnalysis.filter({
      modeling_id,
      material_id,
      material_type
    });

    let analysisId;
    if (existingAnalyses.length > 0) {
      analysisId = existingAnalyses[0].id;
      await base44.entities.ModelingAnalysis.update(analysisId, {
        status: 'analyzing',
        error_message: null
      });
    } else {
      const newAnalysis = await base44.entities.ModelingAnalysis.create({
        modeling_id,
        material_id,
        material_type,
        material_title: material_title || 'Sem título',
        status: 'analyzing'
      });
      analysisId = newAnalysis.id;
    }

    // Chamar OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('BASE44_APP_URL') || 'https://base44.com',
        'X-Title': 'ContentAI - Modeling Analyzer'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { 
            role: 'system', 
            content: systemPrompt.replace(/\{\{material_content\}\}/g, content) 
          },
          { 
            role: 'user', 
            content: `Por favor, analise o seguinte conteúdo:\n\n${content}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const analysisSummary = data.choices?.[0]?.message?.content;

    if (!analysisSummary) {
      throw new Error('Resposta inválida da API');
    }

    const charCount = analysisSummary.length;
    const tokenEstimate = Math.ceil(charCount / 4);

    // Atualizar análise com resultado
    await base44.entities.ModelingAnalysis.update(analysisId, {
      analysis_summary: analysisSummary,
      character_count: charCount,
      token_estimate: tokenEstimate,
      status: 'completed',
      error_message: null
    });

    return Response.json({
      success: true,
      analysis_id: analysisId,
      character_count: charCount,
      token_estimate: tokenEstimate
    });

  } catch (error) {
    console.error('Erro na análise:', error);
    
    // Tentar atualizar status para erro se já tiver um ID
    try {
      const { modeling_id, material_id, material_type } = await req.json();
      const existingAnalyses = await base44.entities.ModelingAnalysis.filter({
        modeling_id,
        material_id,
        material_type
      });
      
      if (existingAnalyses.length > 0) {
        await base44.entities.ModelingAnalysis.update(existingAnalyses[0].id, {
          status: 'error',
          error_message: error.message
        });
      }
    } catch {}

    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});