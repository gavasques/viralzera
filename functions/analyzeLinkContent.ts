import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

/**
 * Função para analisar links da modelagem usando OpenRouter
 * Usa o agente Modelagem - Analisador de Links
 */
Deno.serve(async (req) => {
  try {
    const neon = createClientFromRequest(req);
    const user = await neon.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { linkId, modeling_id } = await req.json();

    if (!linkId || !modeling_id) {
      return Response.json({ 
        error: 'linkId e modeling_id são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar link
    const links = await neon.entities.ModelingLink.filter({ id: linkId });
    const link = links[0];
    
    if (!link || !link.content) {
      return Response.json({ 
        error: 'Link não encontrado ou sem conteúdo. Execute "Puxar Dados" primeiro.' 
      }, { status: 404 });
    }

    // Atualizar status para processing
    await neon.entities.ModelingLink.update(linkId, {
      analysis_status: 'processing',
      analysis_error_message: null
    });

    try {
      // Buscar configuração do agente de análise de links
      const configs = await neon.asServiceRole.entities.ModelingLinkAnalyzerConfig.list();
      const config = configs[0];

      if (!config?.model) {
        throw new Error('Configure o agente de Análise de Links em Configurações de Agentes');
      }

      // Buscar API key do usuário
      const userConfigs = await neon.asServiceRole.entities.UserConfig.filter({ 
        created_by: user.email 
      });
      const apiKey = userConfigs[0]?.openrouter_api_key;

      if (!apiKey) {
        throw new Error('Configure sua API Key do OpenRouter em Configurações');
      }

      // Preparar prompt com purpose se existir
      let userMessage = `Por favor, analise este conteúdo:\n\n${link.content}`;
      if (link.purpose) {
        userMessage = `Finalidade da análise: ${link.purpose}\n\n${userMessage}`;
      }

      const systemPrompt = config.prompt || 'Analise este conteúdo de forma detalhada, extraindo insights e informações relevantes.';

      // Chamar OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://app.neon.com',
          'X-Title': 'ContentAI - Link Analyzer'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
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

      // Salvar análise na tabela ModelingAnalysis
      const analysisRecord = await neon.asServiceRole.entities.ModelingAnalysis.create({
        modeling_id,
        material_id: linkId,
        material_type: 'link',
        material_title: link.title || link.url,
        analysis_summary: analysis,
        character_count: analysis.length,
        token_estimate: Math.ceil(analysis.length / 4),
        status: 'completed',
        created_by: user.email
      });

      // Atualizar status de análise do link
      await neon.entities.ModelingLink.update(linkId, {
        analysis_status: 'completed',
        analysis_error_message: null
      });

      return Response.json({ 
        success: true, 
        analysisId: analysisRecord.id,
        analysis 
      });

    } catch (error) {
      // Atualizar status para error
      await neon.entities.ModelingLink.update(linkId, {
        analysis_status: 'error',
        analysis_error_message: error.message
      });
      throw error;
    }

  } catch (error) {
    console.error('Erro ao analisar link:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});