import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { link_id } = await req.json();

    if (!link_id) {
      return Response.json({ error: 'link_id é obrigatório' }, { status: 400 });
    }

    // Buscar o link
    const links = await base44.entities.ModelingLink.filter({ id: link_id });
    const link = links[0];

    if (!link) {
      return Response.json({ error: 'Link não encontrado' }, { status: 404 });
    }

    // Atualizar status para processing
    await base44.entities.ModelingLink.update(link_id, {
      status: 'processing',
      error_message: null
    });

    try {
      // Buscar configuração do agente
      const configs = await base44.entities.ModelingScraperConfig.list();
      const config = configs?.[0];

      const model = config?.model || 'openai/gpt-4o-mini';
      const systemPrompt = config?.prompt || `Resuma este artigo em seus pontos-chave e insights mais importantes para um criador de conteúdo do YouTube. Foque em informações que possam virar tópicos de vídeo.`;

      // Extrair conteúdo do link usando a API InvokeLLM com web search
      const extractResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extraia o conteúdo principal deste artigo, removendo navegação, ads e elementos irrelevantes. Retorne apenas o texto do artigo de forma limpa e estruturada.\n\nURL: ${link.url}`,
        add_context_from_internet: true
      });

      const articleContent = extractResponse;

      if (!articleContent || articleContent.length < 100) {
        throw new Error('Não foi possível extrair conteúdo suficiente do link');
      }

      // Buscar API key
      const userConfigs = await base44.entities.UserConfig.filter({ created_by: user.email });
      const apiKey = userConfigs[0]?.openrouter_api_key;

      if (!apiKey) {
        throw new Error('Configure sua API Key do OpenRouter');
      }

      // Substituir placeholder
      const finalPrompt = systemPrompt.replace(/\{\{conteudo_artigo\}\}/g, articleContent);

      // Chamar OpenRouter para gerar resumo
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': Deno.env.get('APP_URL') || 'https://app.base44.com',
          'X-Title': 'ContentAI - Link Scraper'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: finalPrompt },
            { role: 'user', content: articleContent }
          ],
          temperature: 0.5,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content;

      if (!summary) {
        throw new Error('Resposta inválida da API');
      }

      const charCount = summary.length;
      const tokenEstimate = Math.ceil(charCount / 4);

      // Atualizar link com resumo
      await base44.entities.ModelingLink.update(link_id, {
        summary,
        content: articleContent,
        character_count: charCount,
        token_estimate: tokenEstimate,
        status: 'completed',
        error_message: null
      });

      // Atualizar totais da modelagem
      const allLinks = await base44.entities.ModelingLink.filter({ modeling_id: link.modeling_id });
      const allVideos = await base44.entities.ModelingVideo.filter({ modeling_id: link.modeling_id });
      const allTexts = await base44.entities.ModelingText.filter({ modeling_id: link.modeling_id });

      const videoChars = allVideos.reduce((sum, v) => sum + (v.character_count || 0), 0);
      const videoTokens = allVideos.reduce((sum, v) => sum + (v.token_estimate || 0), 0);
      const textChars = allTexts.reduce((sum, t) => sum + (t.character_count || 0), 0);
      const textTokens = allTexts.reduce((sum, t) => sum + (t.token_estimate || 0), 0);
      const linkChars = allLinks.reduce((sum, l) => sum + (l.character_count || 0), 0);
      const linkTokens = allLinks.reduce((sum, l) => sum + (l.token_estimate || 0), 0);

      await base44.entities.Modeling.update(link.modeling_id, {
        total_characters: videoChars + textChars + linkChars,
        total_tokens_estimate: videoTokens + textTokens + linkTokens
      });

      return Response.json({
        success: true,
        summary,
        usage: data.usage
      });

    } catch (error) {
      // Atualizar status para error
      await base44.entities.ModelingLink.update(link_id, {
        status: 'error',
        error_message: error.message
      });
      throw error;
    }

  } catch (error) {
    console.error('Erro no scraper:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});