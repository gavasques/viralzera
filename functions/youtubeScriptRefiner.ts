import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

const REFINEMENT_PROMPTS = {
  // Hook refinements
  hook_alternatives: {
    name: "3 Hooks Alternativos",
    prompt: `Você é um especialista em roteiros para YouTube. Analise o hook atual e gere EXATAMENTE 3 alternativas mais magnéticas e contraintuitivas.

HOOK ATUAL:
{content}

CONTEXTO DO VÍDEO:
- Título: {title}
- Tipo: {videoType}

REGRAS:
1. Cada hook deve ter no máximo 3 frases
2. Use técnicas de curiosidade, controvérsia ou promessa ousada
3. Quebre expectativas do espectador
4. Seja direto e impactante

Responda em JSON:
{
  "suggestions": [
    { "title": "Hook 1 - [técnica usada]", "content": "texto do hook" },
    { "title": "Hook 2 - [técnica usada]", "content": "texto do hook" },
    { "title": "Hook 3 - [técnica usada]", "content": "texto do hook" }
  ]
}`
  },
  hook_contraintuitivo: {
    name: "Mais Contraintuitivo",
    prompt: `Reescreva este hook usando a técnica CONTRAINTUITIVA - quebrando completamente as expectativas do espectador.

HOOK ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Gere 2 versões contraintuitivas que façam o espectador pensar "espera, o quê?!"

Responda em JSON:
{
  "suggestions": [
    { "title": "Versão Contraintuitiva 1", "content": "texto" },
    { "title": "Versão Contraintuitiva 2", "content": "texto" }
  ]
}`
  },
  hook_curiosidade: {
    name: "Adicionar Curiosidade",
    prompt: `Adicione elementos de CURIOSIDADE IRRESISTÍVEL a este hook. Use loops abertos, perguntas provocativas ou revelações parciais.

HOOK ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Gere 2 versões com curiosidade amplificada.

Responda em JSON:
{
  "suggestions": [
    { "title": "Com Loop Aberto", "content": "texto" },
    { "title": "Com Revelação Parcial", "content": "texto" }
  ]
}`
  },

  // Apresentação refinements
  apresentacao_pessoal: {
    name: "Tornar Mais Pessoal",
    prompt: `Torne esta apresentação mais PESSOAL e CONECTADA com o espectador. Adicione vulnerabilidade, história pessoal ou conexão emocional.

APRESENTAÇÃO ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Gere 2 versões mais pessoais.

Responda em JSON:
{
  "suggestions": [
    { "title": "Com História Pessoal", "content": "texto" },
    { "title": "Com Vulnerabilidade", "content": "texto" }
  ]
}`
  },
  apresentacao_credibilidade: {
    name: "Adicionar Credibilidade",
    prompt: `Adicione elementos de CREDIBILIDADE e AUTORIDADE a esta apresentação. Use provas sociais, resultados ou experiência.

APRESENTAÇÃO ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Gere 2 versões com mais credibilidade.

Responda em JSON:
{
  "suggestions": [
    { "title": "Com Prova Social", "content": "texto" },
    { "title": "Com Resultados", "content": "texto" }
  ]
}`
  },
  apresentacao_encurtar: {
    name: "Encurtar",
    prompt: `Encurte esta apresentação mantendo o essencial. Seja DIRETO e CONCISO.

APRESENTAÇÃO ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Gere 2 versões mais curtas (máximo 2 frases cada).

Responda em JSON:
{
  "suggestions": [
    { "title": "Versão Ultra-Curta", "content": "texto" },
    { "title": "Versão Compacta", "content": "texto" }
  ]
}`
  },

  // Ponte refinements
  ponte_expectativa: {
    name: "Criar Mais Expectativa",
    prompt: `Aumente a EXPECTATIVA e ANTECIPAÇÃO nesta ponte. Faça o espectador ansiar pelo conteúdo que vem.

PONTE ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Gere 2 versões com mais expectativa.

Responda em JSON:
{
  "suggestions": [
    { "title": "Com Promessa Forte", "content": "texto" },
    { "title": "Com Antecipação", "content": "texto" }
  ]
}`
  },
  ponte_conectar_hook: {
    name: "Conectar Melhor com Hook",
    prompt: `Melhore a CONEXÃO desta ponte com o hook do vídeo. A transição deve ser fluida e natural.

PONTE ATUAL:
{content}

HOOK DO VÍDEO (para referência):
{hookContent}

CONTEXTO: {title} ({videoType})

Gere 2 versões com melhor conexão.

Responda em JSON:
{
  "suggestions": [
    { "title": "Transição Suave", "content": "texto" },
    { "title": "Transição Impactante", "content": "texto" }
  ]
}`
  },
  ponte_promessa: {
    name: "Adicionar Promessa",
    prompt: `Adicione uma PROMESSA clara e específica a esta ponte. O que exatamente o espectador vai ganhar?

PONTE ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Gere 2 versões com promessa clara.

Responda em JSON:
{
  "suggestions": [
    { "title": "Com Promessa Específica", "content": "texto" },
    { "title": "Com Benefício Claro", "content": "texto" }
  ]
}`
  },

  // Corpo refinements
  corpo_psp: {
    name: "Aplicar Técnica PSP",
    prompt: `Reescreva este corpo aplicando a técnica PSP (Problema-Solução-Problema) em cada tópico. Crie loops de engajamento.

CORPO ATUAL:
{content}

CONTEXTO: {title} ({videoType})

TÉCNICA PSP:
1. Apresente um PROBLEMA específico
2. Dê a SOLUÇÃO
3. Apresente um NOVO PROBLEMA (que leva ao próximo tópico)

Reescreva mantendo a estrutura de tópicos mas aplicando PSP.

Responda em JSON:
{
  "suggestions": [
    { "title": "Corpo com PSP Aplicado", "content": "texto completo reescrito" }
  ]
}`
  },
  corpo_topicos: {
    name: "Adicionar Mais Tópicos",
    prompt: `Sugira 3 NOVOS TÓPICOS que poderiam ser adicionados a este corpo para enriquecer o conteúdo.

CORPO ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Para cada tópico, forneça:
- Título do tópico
- Conteúdo desenvolvido (2-3 parágrafos)

Responda em JSON:
{
  "suggestions": [
    { "title": "Novo Tópico 1: [nome]", "content": "desenvolvimento completo" },
    { "title": "Novo Tópico 2: [nome]", "content": "desenvolvimento completo" },
    { "title": "Novo Tópico 3: [nome]", "content": "desenvolvimento completo" }
  ]
}`
  },
  corpo_transicoes: {
    name: "Melhorar Transições",
    prompt: `Melhore as TRANSIÇÕES entre os tópicos deste corpo. Crie conexões mais fluidas e engajantes.

CORPO ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Reescreva o corpo com transições melhoradas entre cada seção.

Responda em JSON:
{
  "suggestions": [
    { "title": "Corpo com Transições Melhoradas", "content": "texto completo reescrito" }
  ]
}`
  },

  // Resumo refinements
  resumo_pontos_chave: {
    name: "Reforçar Pontos-Chave",
    prompt: `Reforce os PONTOS-CHAVE neste resumo. Deixe claro o que o espectador deve lembrar.

RESUMO ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Gere 2 versões com pontos-chave mais claros.

Responda em JSON:
{
  "suggestions": [
    { "title": "Com Lista de Pontos", "content": "texto" },
    { "title": "Com Destaque Emocional", "content": "texto" }
  ]
}`
  },
  resumo_urgencia: {
    name: "Criar Urgência",
    prompt: `Adicione URGÊNCIA a este resumo. Faça o espectador sentir que precisa agir agora.

RESUMO ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Gere 2 versões com senso de urgência.

Responda em JSON:
{
  "suggestions": [
    { "title": "Com Urgência Temporal", "content": "texto" },
    { "title": "Com Urgência de Oportunidade", "content": "texto" }
  ]
}`
  },
  resumo_conectar_cta: {
    name: "Conectar com CTA",
    prompt: `Melhore a conexão deste resumo com o CTA. A transição deve ser natural e persuasiva.

RESUMO ATUAL:
{content}

CTA DO VÍDEO (para referência):
{ctaContent}

CONTEXTO: {title} ({videoType})

Gere 2 versões com melhor conexão para o CTA.

Responda em JSON:
{
  "suggestions": [
    { "title": "Transição Suave para CTA", "content": "texto" },
    { "title": "Build-up para CTA", "content": "texto" }
  ]
}`
  },

  // CTA refinements
  cta_alternatives: {
    name: "5 CTAs Diferentes",
    prompt: `Gere 5 CTAs alternativos para este vídeo, cada um com uma abordagem diferente.

CTA ATUAL:
{content}

CONTEXTO:
- Título: {title}
- Tipo: {videoType}
- Resumo: {resumoContent}

ABORDAGENS:
1. Direto e Simples
2. Com Benefício
3. Com Urgência
4. Com Prova Social
5. Com Reciprocidade

Responda em JSON:
{
  "suggestions": [
    { "title": "CTA Direto", "content": "texto" },
    { "title": "CTA com Benefício", "content": "texto" },
    { "title": "CTA com Urgência", "content": "texto" },
    { "title": "CTA com Prova Social", "content": "texto" },
    { "title": "CTA com Reciprocidade", "content": "texto" }
  ]
}`
  },
  cta_persuasivo: {
    name: "Mais Persuasivo",
    prompt: `Torne este CTA mais PERSUASIVO usando técnicas de copywriting.

CTA ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Gere 2 versões mais persuasivas.

Responda em JSON:
{
  "suggestions": [
    { "title": "Com Técnica de Escassez", "content": "texto" },
    { "title": "Com Técnica de Autoridade", "content": "texto" }
  ]
}`
  },
  cta_urgencia: {
    name: "Senso de Urgência",
    prompt: `Adicione SENSO DE URGÊNCIA a este CTA. Faça o espectador agir AGORA.

CTA ATUAL:
{content}

CONTEXTO: {title} ({videoType})

Gere 2 versões com urgência.

Responda em JSON:
{
  "suggestions": [
    { "title": "Urgência Temporal", "content": "texto" },
    { "title": "Urgência de Perda", "content": "texto" }
  ]
}`
  },

  // Modelagem analysis
  analyze_modeling: {
    name: "Analisar Modelagens",
    prompt: `Você é um especialista em análise de conteúdo. Analise as modelagens de referência e sugira melhorias para a seção atual.

SEÇÃO ATUAL ({sectionName}):
{content}

MODELAGENS DE REFERÊNCIA:
{modelingContent}

CONTEXTO DO VÍDEO:
- Título: {title}
- Tipo: {videoType}

TAREFA:
1. Identifique padrões e técnicas usadas nas modelagens
2. Compare com a seção atual
3. Sugira 2-3 melhorias específicas baseadas nos padrões identificados

Responda em JSON:
{
  "analysis": "Breve análise dos padrões identificados nas modelagens",
  "suggestions": [
    { "title": "Melhoria 1: [técnica identificada]", "content": "texto melhorado" },
    { "title": "Melhoria 2: [técnica identificada]", "content": "texto melhorado" }
  ]
}`
  }
};

Deno.serve(async (req) => {
  try {
    const neon = createClientFromRequest(req);
    const user = await neon.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, content, context, modelingData } = await req.json();

    if (!action || !REFINEMENT_PROMPTS[action]) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get user's OpenRouter API key
    const userConfigs = await neon.entities.UserConfig.filter({ created_by: user.email });
    const userConfig = userConfigs[0];

    if (!userConfig?.openrouter_api_key) {
      return Response.json({ 
        error: 'API Key do OpenRouter não configurada. Vá em Configurações para adicionar.' 
      }, { status: 400 });
    }

    // Build the prompt
    let prompt = REFINEMENT_PROMPTS[action].prompt
      .replace('{content}', content || '')
      .replace('{title}', context?.title || '')
      .replace('{videoType}', context?.videoType || '')
      .replace('{hookContent}', context?.hookContent || '')
      .replace('{ctaContent}', context?.ctaContent || '')
      .replace('{resumoContent}', context?.resumoContent || '')
      .replace('{sectionName}', context?.sectionName || '')
      .replace('{modelingContent}', modelingData || '');

    // Use configured model or default
    const model = userConfig.default_model || 'openai/gpt-4o-mini';

    // Call OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userConfig.openrouter_api_key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://neon.com',
        'X-Title': 'YouTube Script Refiner'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em roteiros para YouTube. Sempre responda em JSON válido conforme solicitado.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter error:', error);
      return Response.json({ error: 'Erro ao chamar a IA' }, { status: 500 });
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content;

    if (!aiContent) {
      return Response.json({ error: 'Resposta vazia da IA' }, { status: 500 });
    }

    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      return Response.json({ error: 'Erro ao processar resposta da IA' }, { status: 500 });
    }

    return Response.json({
      success: true,
      data: parsedResponse,
      usage: data.usage
    });

  } catch (error) {
    console.error('Error in youtubeScriptRefiner:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});