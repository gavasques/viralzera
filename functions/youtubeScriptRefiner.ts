import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      action,           // ID da ação de refinamento
      actionPrompt,     // Prompt específico da ação
      content,          // Conteúdo atual da seção
      sectionKey,       // Chave da seção (hook, corpo, etc)
      context,          // Contexto do roteiro (título, tipo, etc)
      modelingData,     // Dados das modelagens (opcional)
      model             // Modelo a usar (opcional, usa default se não enviado)
    } = await req.json();

    if (!content || !actionPrompt) {
      return Response.json({ 
        success: false, 
        error: 'Conteúdo e ação são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar configuração do usuário para modelo padrão
    let selectedModel = model;
    if (!selectedModel) {
      const userConfigs = await base44.entities.UserConfig.filter({});
      if (userConfigs && userConfigs.length > 0) {
        selectedModel = userConfigs[0].default_model;
      }
    }
    
    // Fallback para modelo padrão
    if (!selectedModel) {
      selectedModel = 'anthropic/claude-3.5-sonnet';
    }

    // Construir o prompt completo
    let systemPrompt = `Você é um especialista em copywriting para YouTube, especializado em criar roteiros magnéticos que prendem a atenção e geram engajamento.

Sua tarefa é refinar uma seção específica de um roteiro de vídeo YouTube.

CONTEXTO DO VÍDEO:
- Título: ${context?.title || 'Não informado'}
- Tipo de Vídeo: ${context?.videoType || 'Não informado'}
- Seção sendo refinada: ${sectionKey}

REGRAS:
1. Mantenha o mesmo tom e estilo do conteúdo original
2. Seja específico e prático, não genérico
3. Use linguagem conversacional e envolvente
4. Inclua marcações [CORTE], [B-ROLL], [TEXTO NA TELA] quando apropriado
5. Cada sugestão deve ser completa e pronta para uso`;

    // Adicionar contexto das modelagens se disponível
    if (modelingData && modelingData.length > 0) {
      systemPrompt += `

REFERÊNCIAS DE MODELAGEM (aprenda com estes exemplos):
${modelingData.map((m, i) => `
--- Modelagem ${i + 1}: ${m.title} ---
${m.transcript ? `Transcrição: ${m.transcript.substring(0, 2000)}...` : ''}
${m.content ? `Conteúdo: ${m.content.substring(0, 2000)}...` : ''}
${m.creator_idea ? `Insights do Criador: ${m.creator_idea}` : ''}
`).join('\n')}

Use esses exemplos como referência de estilo, estrutura e técnicas. Adapte os padrões identificados para o conteúdo atual.`;
    }

    const userPrompt = `${actionPrompt}

CONTEÚDO ATUAL DA SEÇÃO "${sectionKey.toUpperCase()}":
"""
${content}
"""

Por favor, forneça sua resposta de forma clara e organizada. Se for gerar múltiplas opções, separe cada uma claramente com "---" e numere-as.`;

    // Chamar OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://base44.com',
        'X-Title': 'YouTube Script Refiner'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter error:', errorData);
      return Response.json({ 
        success: false, 
        error: 'Erro ao chamar IA: ' + response.status 
      }, { status: 500 });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      return Response.json({ 
        success: false, 
        error: 'Resposta vazia da IA' 
      }, { status: 500 });
    }

    // Parsear sugestões (separadas por ---)
    const suggestions = aiContent
      .split(/---+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return Response.json({
      success: true,
      suggestions: suggestions.length > 1 ? suggestions : [aiContent],
      usage: data.usage || null,
      model: selectedModel
    });

  } catch (error) {
    console.error('Error in youtubeScriptRefiner:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});