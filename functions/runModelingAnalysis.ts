import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const neon = createClientFromRequest(req);
    const user = await neon.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { materialId, materialType, content, modeling_id } = await req.json();

    if (!materialId || !materialType || !content || !modeling_id) {
      return Response.json({ 
        error: 'Missing required fields: materialId, materialType, content, modeling_id' 
      }, { status: 400 });
    }

    // Buscar configuração do agente
    const configs = await neon.asServiceRole.entities.ModelingAnalyzerConfig.list();
    const config = configs[0];

    if (!config?.model) {
      return Response.json({ 
        error: 'Agente Analisador Individual não configurado' 
      }, { status: 400 });
    }

    // Buscar API key do usuário
    const userConfigs = await neon.asServiceRole.entities.UserConfig.filter({ 
      created_by: user.email 
    });
    const apiKey = userConfigs[0]?.openrouter_api_key;

    if (!apiKey) {
      return Response.json({ 
        error: 'API Key do OpenRouter não configurada' 
      }, { status: 400 });
    }

    // Buscar título do material
    let materialTitle = 'Material sem título';
    if (materialType === 'video') {
      const videos = await neon.asServiceRole.entities.ModelingVideo.filter({ id: materialId });
      materialTitle = videos[0]?.title || materialTitle;
    } else if (materialType === 'text') {
      const texts = await neon.asServiceRole.entities.ModelingText.filter({ id: materialId });
      materialTitle = texts[0]?.title || materialTitle;
    } else if (materialType === 'link') {
      const links = await neon.asServiceRole.entities.ModelingLink.filter({ id: materialId });
      materialTitle = links[0]?.title || materialTitle;
    }

    // Preparar prompt
    const systemPrompt = config.prompt.replace(/\{\{material_content\}\}/g, content);

    // Chamar OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://app.neon.com',
        'X-Title': 'ContentAI - Modeling Analyzer'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Por favor, analise este ${materialType}:\n\n${content}` }
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
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('Resposta inválida da API');
    }

    // Salvar análise
    const analysisRecord = await neon.asServiceRole.entities.ModelingAnalysis.create({
      modeling_id,
      material_id: materialId,
      material_type: materialType,
      material_title: materialTitle,
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
    console.error('Erro ao analisar material:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});