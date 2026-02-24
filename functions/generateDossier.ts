import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const neon = createClientFromRequest(req);
    const user = await neon.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { modeling_id } = await req.json();

    if (!modeling_id) {
      return Response.json({ error: 'modeling_id é obrigatório' }, { status: 400 });
    }

    // Buscar configuração do agente
    const configs = await neon.entities.DossierGeneratorConfig.list();
    const config = configs?.[0];

    const model = config?.model || 'openai/gpt-4o-mini';
    const systemPrompt = config?.prompt || `Você é um organizador de conteúdo. Sua tarefa é pegar os diversos materiais brutos (transcrições, textos, notas) e organizá-los em um único documento coeso em formato Markdown, chamado 'Dossiê de Conteúdo'. Crie seções claras para cada tipo de material.`;

    // Buscar todos os materiais da modelagem
    const modeling = await neon.entities.Modeling.filter({ id: modeling_id });
    const videos = await neon.entities.ModelingVideo.filter({ modeling_id });
    const analyses = await neon.entities.ModelingAnalysis.filter({ modeling_id });
    const texts = await neon.entities.ModelingText.filter({ modeling_id });
    const links = await neon.entities.ModelingLink.filter({ modeling_id });

    if (!modeling[0]) {
      return Response.json({ error: 'Modelagem não encontrada' }, { status: 404 });
    }

    // Montar materiais brutos
    let materiaisBrutos = `# DOSSIÊ DE CONTEÚDO: ${modeling[0].title}\n\n`;
    
    if (modeling[0].description) {
      materiaisBrutos += `**Descrição:** ${modeling[0].description}\n\n`;
    }

    if (modeling[0].target_platform) {
      materiaisBrutos += `**Plataforma:** ${modeling[0].target_platform}\n`;
    }

    if (modeling[0].content_type) {
      materiaisBrutos += `**Tipo de Conteúdo:** ${modeling[0].content_type}\n\n`;
    }

    if (modeling[0].creator_idea) {
      materiaisBrutos += `## 💡 Ideia do Criador\n\n${modeling[0].creator_idea}\n\n`;
    }

    // Adicionar análises de vídeos
    const videoAnalyses = analyses.filter(a => a.material_type === 'video' && a.status === 'completed');
    if (videoAnalyses.length > 0) {
      materiaisBrutos += `---\n\n## 🎥 ANÁLISES DE VÍDEOS DE REFERÊNCIA (${videoAnalyses.length})\n\n`;
      videoAnalyses.forEach((a, i) => {
        const video = videos.find(v => v.id === a.material_id);
        materiaisBrutos += `### ${a.material_title || video?.title || 'Sem título'}\n\n`;
        if (video?.channel_name) {
          materiaisBrutos += `**Canal:** ${video.channel_name}\n`;
        }
        if (video?.url) {
          materiaisBrutos += `**URL:** ${video.url}\n\n`;
        }
        materiaisBrutos += `${a.analysis_summary}\n\n`;
        materiaisBrutos += `---\n\n`;
      });
    } else {
      // Fallback para transcrições se não houver análises (para manter compatibilidade)
      const transcribedVideos = videos.filter(v => v.status === 'transcribed' && v.transcript);
      if (transcribedVideos.length > 0) {
        materiaisBrutos += `---\n\n## 🎥 VÍDEOS TRANSCRITOS (${transcribedVideos.length})\n\n`;
        transcribedVideos.forEach((v, i) => {
          materiaisBrutos += `### Vídeo ${i + 1}: ${v.title || 'Sem título'}\n\n`;
          materiaisBrutos += `**Transcrição:**\n\n${v.transcript}\n\n`;
          materiaisBrutos += `---\n\n`;
        });
      }
    }

    // Adicionar textos
    if (texts.length > 0) {
      materiaisBrutos += `## 📄 TEXTOS DE REFERÊNCIA (${texts.length})\n\n`;
      texts.forEach((t, i) => {
        materiaisBrutos += `### Texto ${i + 1}: ${t.title || 'Sem título'}\n\n`;
        if (t.description) {
          materiaisBrutos += `**Descrição:** ${t.description}\n\n`;
        }
        materiaisBrutos += `${t.content}\n\n`;
        materiaisBrutos += `---\n\n`;
      });
    }

    // Adicionar links processados
    const completedLinks = links.filter(l => l.status === 'completed' && l.summary);
    if (completedLinks.length > 0) {
      materiaisBrutos += `## 🔗 ARTIGOS E LINKS PROCESSADOS (${completedLinks.length})\n\n`;
      completedLinks.forEach((l, i) => {
        materiaisBrutos += `### Link ${i + 1}: ${l.title || 'Sem título'}\n\n`;
        materiaisBrutos += `**URL:** ${l.url}\n\n`;
        if (l.notes) {
          materiaisBrutos += `**Notas:** ${l.notes}\n\n`;
        }
        materiaisBrutos += `**Resumo:**\n\n${l.summary}\n\n`;
        materiaisBrutos += `---\n\n`;
      });
    }

    // Verificar se há conteúdo suficiente
    const hasContent = videoAnalyses.length > 0 || texts.length > 0 || completedLinks.length > 0 || (videos.some(v => v.status === 'transcribed'));
    if (!hasContent && !modeling[0].creator_idea) {
      return Response.json({ 
        error: 'Não há conteúdo suficiente para gerar o dossiê. Adicione vídeos analisados, textos, links processados ou uma ideia do criador.' 
      }, { status: 400 });
    }

    // Buscar API key
    const userConfigs = await neon.entities.UserConfig.filter({ created_by: user.email });
    const apiKey = userConfigs[0]?.openrouter_api_key;

    if (!apiKey) {
      return Response.json({ error: 'Configure sua API Key do OpenRouter' }, { status: 400 });
    }

    // Substituir placeholder
    const finalPrompt = systemPrompt.replace(/\{\{materiais_brutos\}\}/g, materiaisBrutos);

    // Chamar OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('APP_URL') || 'https://app.neon.com',
        'X-Title': 'ContentAI - Dossier Generator'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: finalPrompt },
          { role: 'user', content: 'Organize todos esses materiais em um Dossiê de Conteúdo bem estruturado em Markdown.' }
        ],
        temperature: 0.7,
        max_tokens: 16000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const dossierContent = data.choices?.[0]?.message?.content;

    if (!dossierContent) {
      throw new Error('Resposta inválida da API');
    }

    const charCount = dossierContent.length;
    const tokenEstimate = Math.ceil(charCount / 4);

    // Criar dossiê
    const dossier = await neon.entities.ContentDossier.create({
      modeling_id,
      full_content: dossierContent,
      character_count: charCount,
      token_estimate: tokenEstimate
    });

    return Response.json({
      success: true,
      dossier_id: dossier.id,
      character_count: charCount,
      token_estimate: tokenEstimate,
      usage: data.usage
    });

  } catch (error) {
    console.error('Erro ao gerar dossiê:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});