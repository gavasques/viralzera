import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

/**
 * Backend function para gerar sugestões de títulos para roteiro de YouTube
 */
Deno.serve(async (req) => {
  try {
    const neon = createClientFromRequest(req);
    
    const user = await neon.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { scriptId } = body;

    if (!scriptId) {
      return Response.json({ error: 'scriptId is required' }, { status: 400 });
    }

    // 1. Buscar o roteiro
    const script = await neon.entities.YoutubeScript.get(scriptId);
    if (!script) {
      return Response.json({ error: 'Roteiro não encontrado' }, { status: 404 });
    }

    // 2. Buscar configuração do agente refiner para o modelo
    const refinerConfigs = await neon.entities.YoutubeRefinerConfig.filter({});
    const refinerConfig = refinerConfigs[0];

    if (!refinerConfig?.model) {
      return Response.json({ 
        error: 'Modelo de IA não configurado. Configure o agente YouTube Refiner em Configurações de Agentes.' 
      }, { status: 400 });
    }

    // 3. Buscar API key do usuário
    const userConfigs = await neon.entities.UserConfig.filter({});
    const userConfig = userConfigs[0];
    
    if (!userConfig?.openrouter_api_key) {
      return Response.json({ 
        error: 'API Key não configurada. Vá em Configurações para adicionar sua chave OpenRouter.' 
      }, { status: 400 });
    }

    // 4. Montar prompt para geração de títulos
    const prompt = `Analise o roteiro de vídeo do YouTube abaixo e sugira 5 títulos magnéticos e chamativos.

Os títulos devem:
- Ser curiosos e gerar cliques
- Ter no máximo 60 caracteres
- Usar gatilhos mentais (curiosidade, urgência, benefício)
- Ser variados em estilo (alguns com números, alguns com perguntas, alguns diretos)

## ROTEIRO:
${script.corpo || ''}

## FORMATO DE RESPOSTA:
Retorne APENAS um JSON válido no formato:
{
  "titles": [
    "Título 1",
    "Título 2",
    "Título 3",
    "Título 4",
    "Título 5"
  ]
}`;

    console.log('[youtubeTitleGenerator] Generating titles for script:', scriptId);

    // 5. Chamar OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userConfig.openrouter_api_key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://neon.app',
        'X-Title': 'ContentAI YouTube Title Generator',
      },
      body: JSON.stringify({
        model: refinerConfig.model,
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em copywriting e títulos virais para YouTube. Sempre retorne JSON válido.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[youtubeTitleGenerator] OpenRouter error:', errorText);
      throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log('[youtubeTitleGenerator] Raw response:', content);

    // 6. Parse JSON response
    let titles = [];
    try {
      const parsed = JSON.parse(content);
      titles = parsed.titles || [];
    } catch (parseError) {
      // Tenta extrair títulos do texto se JSON falhar
      const matches = content.match(/"([^"]+)"/g);
      if (matches) {
        titles = matches.slice(0, 5).map(m => m.replace(/"/g, ''));
      }
    }

    if (titles.length === 0) {
      throw new Error('Não foi possível gerar títulos. Tente novamente.');
    }

    // 7. Log de uso
    const usage = data.usage || {};
    await neon.entities.UsageLog.create({
      user_email: user.email,
      feature: 'youtube_title_generator',
      model: refinerConfig.model,
      model_name: refinerConfig.model.split('/')[1] || refinerConfig.model,
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
      success: true,
    });

    return Response.json({
      success: true,
      titles: titles.slice(0, 5)
    });

  } catch (error) {
    console.error('[youtubeTitleGenerator] Error:', error.message);
    return Response.json({ 
      error: error.message || 'Erro ao gerar títulos' 
    }, { status: 500 });
  }
});