import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

/**
 * Função para transcrever vídeos do YouTube usando OpenRouter + Gemini 2.5 Flash
 * Suporta:
 * - transcribe: transcrever um vídeo específico
 * - updateTotals: atualizar totais de caracteres/tokens da modelagem
 */
Deno.serve(async (req) => {
  try {
    const neon = createClientFromRequest(req);
    
    // Authenticate user
    const user = await neon.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { action, videoId, modelingId } = body;

    // Action: Update totals for modeling
    if (action === 'updateTotals') {
      return await updateModelingTotals(neon, modelingId);
    }

    // Action: Transcribe video
    if (action === 'transcribe') {
      return await transcribeVideo(neon, videoId);
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('ModelingTranscribe error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error',
      stack: error.stack
    }, { status: 500 });
  }
});

/**
 * Transcreve um vídeo do YouTube usando OpenRouter + Gemini 2.5 Flash
 */
async function transcribeVideo(neon, videoId) {
  if (!videoId) {
    return Response.json({ error: 'videoId é obrigatório' }, { status: 400 });
  }

  // Buscar o vídeo
  const videos = await neon.entities.ModelingVideo.filter({ id: videoId });
  const video = videos[0];
  
  if (!video) {
    return Response.json({ error: 'Vídeo não encontrado' }, { status: 404 });
  }

  // Atualizar status para 'transcribing'
  await neon.entities.ModelingVideo.update(videoId, { 
    status: 'transcribing',
    error_message: null
  });

  try {
    // Buscar API Key do usuário
    const user = await neon.auth.me();
    const userConfigs = await neon.entities.UserConfig.filter({ created_by: user.email });
    const apiKey = userConfigs[0]?.openrouter_api_key;
    
    if (!apiKey) {
      throw new Error('Configure sua API Key do OpenRouter em Configurações');
    }

    // Buscar config de modelagem para usar prompt e modelo customizados
    const configs = await neon.asServiceRole.entities.ModelingConfig.list();
    const config = configs?.[0];
    
    if (!config?.model) {
      throw new Error('Configure o modelo de transcrição em Configurações de Agentes > Modelagem');
    }
    
    const model = config.model;
    const systemPrompt = config.prompt || `Você é um especialista em transcrição de vídeos.

Tarefa:
- Transcreva todo o conteúdo do vídeo com precisão
- Mantenha a linguagem original e expressões usadas pelo palestrante
- Preserve gírias, palavras de preenchimento (tipo, né, mano, tá ligado, etc.)
- Mantenha padrões naturais de fala
- Marque [RISOS] para risadas, [PAUSA] para pausas
- NÃO reescreva em português formal - preserve a voz original

Retorne APENAS o texto da transcrição, limpo e normalizado.`;

    // Chamar OpenRouter com o vídeo do YouTube
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://app.neon.com',
        'X-Title': 'ContentAI - Modelagem'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Por favor, transcreva todo o conteúdo deste vídeo.'
              },
              {
                type: 'video_url',
                video_url: {
                  url: video.url
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 16000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Resposta inválida da API');
    }

    const transcript = data.choices[0].message.content;
    const charCount = transcript.length;
    const tokenEstimate = Math.ceil(charCount / 4);

    // Atualizar vídeo com transcrição
    await neon.entities.ModelingVideo.update(videoId, {
      transcript,
      character_count: charCount,
      token_estimate: tokenEstimate,
      status: 'transcribed',
      error_message: null
    });

    // Atualizar totais da modelagem
    await updateModelingTotals(neon, video.modeling_id);

    return Response.json({ 
      success: true,
      transcript,
      character_count: charCount,
      token_estimate: tokenEstimate
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Atualizar status para 'error'
    await neon.entities.ModelingVideo.update(videoId, {
      status: 'error',
      error_message: error.message
    });

    return Response.json({ 
      error: error.message || 'Erro na transcrição'
    }, { status: 500 });
  }
}

/**
 * Atualiza os totais de caracteres e tokens de uma modelagem
 */
async function updateModelingTotals(neon, modelingId) {
  if (!modelingId) {
    return Response.json({ error: 'modelingId é obrigatório' }, { status: 400 });
  }

  try {
    // Buscar todos os vídeos e textos da modelagem
    const videos = await neon.entities.ModelingVideo.filter({ modeling_id: modelingId });
    const texts = await neon.entities.ModelingText.filter({ modeling_id: modelingId });

    // Calcular totais
    const videoChars = videos.reduce((sum, v) => sum + (v.character_count || 0), 0);
    const videoTokens = videos.reduce((sum, v) => sum + (v.token_estimate || 0), 0);
    
    const textChars = texts.reduce((sum, t) => sum + (t.character_count || 0), 0);
    const textTokens = texts.reduce((sum, t) => sum + (t.token_estimate || 0), 0);

    const totalChars = videoChars + textChars;
    const totalTokens = videoTokens + textTokens;

    // Atualizar modelagem
    await neon.entities.Modeling.update(modelingId, {
      total_characters: totalChars,
      total_tokens_estimate: totalTokens
    });

    return Response.json({
      success: true,
      total_characters: totalChars,
      total_tokens_estimate: totalTokens
    });

  } catch (error) {
    console.error('UpdateTotals error:', error);
    return Response.json({ 
      error: error.message || 'Erro ao atualizar totais'
    }, { status: 500 });
  }
}