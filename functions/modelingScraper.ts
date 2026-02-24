import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

/**
 * Função para extrair conteúdo de links da modelagem
 * Apenas faz scraping do conteúdo, não analisa
 */
Deno.serve(async (req) => {
  try {
    const neon = createClientFromRequest(req);
    const user = await neon.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { link_id } = await req.json();

    if (!link_id) {
      return Response.json({ error: 'link_id é obrigatório' }, { status: 400 });
    }

    // Buscar o link
    const links = await neon.entities.ModelingLink.filter({ id: link_id });
    const link = links[0];

    if (!link) {
      return Response.json({ error: 'Link não encontrado' }, { status: 404 });
    }

    // Atualizar status para processing
    await neon.entities.ModelingLink.update(link_id, {
      scrape_status: 'processing',
      scrape_error_message: null
    });

    try {
      // Extrair conteúdo do link usando a API InvokeLLM com web search
      const extractResponse = await neon.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extraia o conteúdo principal deste artigo, removendo navegação, ads e elementos irrelevantes. Retorne apenas o texto do artigo de forma limpa e estruturada.\n\nURL: ${link.url}`,
        add_context_from_internet: true
      });

      const articleContent = extractResponse;

      if (!articleContent || articleContent.length < 100) {
        throw new Error('Não foi possível extrair conteúdo suficiente do link');
      }

      const charCount = articleContent.length;
      const tokenEstimate = Math.ceil(charCount / 4);

      // Atualizar link com conteúdo extraído
      await neon.entities.ModelingLink.update(link_id, {
        content: articleContent,
        character_count: charCount,
        token_estimate: tokenEstimate,
        scrape_status: 'completed',
        scrape_error_message: null
      });

      // Atualizar totais da modelagem
      const allLinks = await neon.entities.ModelingLink.filter({ modeling_id: link.modeling_id });
      const allVideos = await neon.entities.ModelingVideo.filter({ modeling_id: link.modeling_id });
      const allTexts = await neon.entities.ModelingText.filter({ modeling_id: link.modeling_id });

      const videoChars = allVideos.reduce((sum, v) => sum + (v.character_count || 0), 0);
      const videoTokens = allVideos.reduce((sum, v) => sum + (v.token_estimate || 0), 0);
      const textChars = allTexts.reduce((sum, t) => sum + (t.character_count || 0), 0);
      const textTokens = allTexts.reduce((sum, t) => sum + (t.token_estimate || 0), 0);
      const linkChars = allLinks.reduce((sum, l) => sum + (l.character_count || 0), 0);
      const linkTokens = allLinks.reduce((sum, l) => sum + (l.token_estimate || 0), 0);

      await neon.entities.Modeling.update(link.modeling_id, {
        total_characters: videoChars + textChars + linkChars,
        total_tokens_estimate: videoTokens + textTokens + linkTokens
      });

      return Response.json({
        success: true,
        content: articleContent,
        character_count: charCount,
        token_estimate: tokenEstimate
      });

    } catch (error) {
      // Atualizar status para error
      await neon.entities.ModelingLink.update(link_id, {
        scrape_status: 'error',
        scrape_error_message: error.message
      });
      throw error;
    }

  } catch (error) {
    console.error('Erro no scraper:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});