import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const neon = createClientFromRequest(req);
    const user = await neon.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { modeling_id, message } = await req.json();

    if (!modeling_id || !message) {
      return Response.json({ error: 'modeling_id e message são obrigatórios' }, { status: 400 });
    }

    // Buscar configuração do agente
    const configs = await neon.entities.ModelingAssistantConfig.list();
    const config = configs?.[0];

    const model = config?.model || 'openai/gpt-4o-mini';
    const systemPrompt = config?.prompt || `Você é um Assistente de Estratégia de Conteúdo para YouTube. Use o contexto fornecido (transcrições, textos, notas) para ajudar o usuário a ter ideias, analisar ângulos e estruturar tópicos para um novo vídeo. Seja um parceiro de brainstorming.`;

    // Buscar histórico do chat
    const chatHistory = await neon.entities.ModelingChat.filter(
      { modeling_id },
      '-created_date',
      50
    );

    // Buscar contexto da modelagem
    const modeling = await neon.entities.Modeling.filter({ id: modeling_id });
    const videos = await neon.entities.ModelingVideo.filter({ modeling_id });
    const texts = await neon.entities.ModelingText.filter({ modeling_id });
    const links = await neon.entities.ModelingLink.filter({ modeling_id });

    // Montar contexto
    let contexto = `# MODELAGEM: ${modeling[0]?.title || 'Sem título'}\n\n`;
    
    if (modeling[0]?.creator_idea) {
      contexto += `## Ideia do Criador\n${modeling[0].creator_idea}\n\n`;
    }

    if (videos.length > 0) {
      contexto += `## Vídeos (${videos.length})\n`;
      videos.forEach((v, i) => {
        contexto += `\n### Vídeo ${i + 1}: ${v.title || 'Sem título'}\n`;
        if (v.transcript) {
          contexto += `${v.transcript.substring(0, 2000)}${v.transcript.length > 2000 ? '...' : ''}\n`;
        }
      });
      contexto += '\n';
    }

    if (texts.length > 0) {
      contexto += `## Textos (${texts.length})\n`;
      texts.forEach((t, i) => {
        contexto += `\n### Texto ${i + 1}: ${t.title || 'Sem título'}\n${t.content}\n`;
      });
    }

    if (links.length > 0) {
      contexto += `\n## Links Processados (${links.length})\n`;
      links.filter(l => l.status === 'completed').forEach((l, i) => {
        contexto += `\n### Link ${i + 1}: ${l.title || l.url}\n`;
        if (l.summary) {
          contexto += `${l.summary}\n`;
        }
      });
    }

    // Substituir placeholders
    const finalPrompt = systemPrompt
      .replace(/\{\{contexto_modelagem\}\}/g, contexto)
      .replace(/\{\{historico_chat\}\}/g, JSON.stringify(chatHistory.reverse()));

    // Buscar API key
    const userConfigs = await neon.entities.UserConfig.filter({ created_by: user.email });
    const apiKey = userConfigs[0]?.openrouter_api_key;

    if (!apiKey) {
      return Response.json({ error: 'Configure sua API Key do OpenRouter' }, { status: 400 });
    }

    // Preparar mensagens
    const messages = [
      { role: 'system', content: finalPrompt },
      ...chatHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // Chamar OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('APP_URL') || 'https://app.neon.com',
        'X-Title': 'ContentAI - Modeling Assistant'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('Resposta inválida da API');
    }

    // Salvar mensagens
    await neon.entities.ModelingChat.create({
      modeling_id,
      role: 'user',
      content: message
    });

    await neon.entities.ModelingChat.create({
      modeling_id,
      role: 'assistant',
      content: assistantMessage,
      usage: data.usage
    });

    return Response.json({
      message: assistantMessage,
      usage: data.usage
    });

  } catch (error) {
    console.error('Erro no assistant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});