import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { YoutubeTranscript } from 'npm:youtube-transcript@3.0.1';

/**
 * Função de backend para transcrição de vídeos de modelagem
 * Recupera legendas do YouTube e processa com IA baseado na configuração do agente
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, videoId, modelingId } = await req.json();

    // ---------------------------------------------------------
    // AÇÃO: TRANSCREVER VÍDEO
    // ---------------------------------------------------------
    if (action === 'transcribe') {
      if (!videoId) return Response.json({ error: 'videoId is required' }, { status: 400 });

      // 1. Busca dados do vídeo
      const video = await base44.entities.ModelingVideo.get(videoId);
      if (!video) return Response.json({ error: 'Video not found' }, { status: 404 });

      // Marca como processando
      await base44.entities.ModelingVideo.update(videoId, { 
        status: 'transcribing', 
        error_message: null 
      });

      try {
        // 2. Busca configurações (API Key do usuário e Config do Agente)
        const [userConfigs, modelingConfigs] = await Promise.all([
          base44.entities.UserConfig.list(),
          base44.entities.ModelingConfig.list()
        ]);

        const userConfig = userConfigs[0];
        const agentConfig = modelingConfigs[0]; // Pega a primeira config encontrada

        if (!userConfig?.openrouter_api_key) {
          throw new Error('API Key do OpenRouter não configurada. Vá em Configurações para adicionar.');
        }

        // Configurações do Agente (ou defaults)
        const model = agentConfig?.model || 'openai/gpt-4o-mini'; // Fallback sensato
        const systemPrompt = agentConfig?.prompt || 
          `You are a Video Transcription Specialist.
           Output language: Brazilian Portuguese (pt-BR).
           Return ONLY the transcript text, clean and normalized.
           Task:
           - Transcribe the entire video content accurately
           - Keep natural speech patterns
           - Do NOT rewrite into formal Portuguese - preserve the voice`;

        // 3. Extrai legenda bruta do YouTube
        console.log(`[ModelingTranscribe] Fetching transcript for video: ${video.url}`);
        let rawTranscriptItems;
        try {
          // Tenta pegar a transcrição. A lib lida com pt, en, ou auto-generated.
          // Podemos passar config de lang se quisermos, mas default costuma funcionar bem.
          rawTranscriptItems = await YoutubeTranscript.fetchTranscript(video.url, { lang: 'pt' })
            .catch(() => YoutubeTranscript.fetchTranscript(video.url)); // Tenta fallback sem lang (en ou auto)
        } catch (err) {
          console.error('[ModelingTranscribe] YoutubeTranscript error:', err);
          throw new Error('Não foi possível extrair a legenda deste vídeo. Verifique se ele possui legendas/CC ativados ou se não é restrito.');
        }

        if (!rawTranscriptItems || rawTranscriptItems.length === 0) {
          throw new Error('Nenhuma legenda encontrada para este vídeo.');
        }

        const fullRawText = rawTranscriptItems.map(item => item.text).join(' ');

        // 4. Processa com IA para limpar/formatar (usando OpenRouter)
        console.log(`[ModelingTranscribe] Processing with AI model: ${model}`);
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userConfig.openrouter_api_key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://base44.app',
            'X-Title': 'ContentAI Modeling Transcriber',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { 
                role: 'user', 
                content: `Here is the raw transcript from YouTube (it may have errors, repetition, or lack punctuation). Please clean and format it according to your instructions:\n\n${fullRawText.substring(0, 100000)}` // Limite de segurança p/ prompt
              }
            ],
            // Opcional: reasoning params se o modelo suportar e estiver na config
            ...(agentConfig?.enable_reasoning && model.includes('claude') ? {
               reasoning: { effort: agentConfig.reasoning_effort || 'medium' } 
            } : {})
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Erro na API de IA (${response.status}): ${errText}`);
        }

        const aiData = await response.json();
        const processedText = aiData.choices?.[0]?.message?.content || fullRawText;

        // 5. Salva resultado
        const charCount = processedText.length;
        const tokenEst = Math.ceil(charCount / 4);

        await base44.entities.ModelingVideo.update(videoId, {
          transcript: processedText,
          status: 'transcribed',
          character_count: charCount,
          token_estimate: tokenEst,
          error_message: null
        });

        // 6. Atualiza totais da modelagem pai
        await updateTotals(base44, video.modeling_id);

        return Response.json({ success: true, transcript: processedText });

      } catch (error) {
        console.error('[ModelingTranscribe] Error:', error.message);
        // Salva erro no banco para mostrar na UI
        await base44.entities.ModelingVideo.update(videoId, {
          status: 'error',
          error_message: error.message
        });
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    // ---------------------------------------------------------
    // AÇÃO: ATUALIZAR TOTAIS (Tokens/Chars da Modelagem)
    // ---------------------------------------------------------
    if (action === 'updateTotals') {
      if (!modelingId) return Response.json({ error: 'modelingId is required' }, { status: 400 });
      
      await updateTotals(base44, modelingId);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('[ModelingTranscribe] Global Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Função auxiliar para recalcular totais de uma modelagem
 */
async function updateTotals(base44, modelingId) {
  try {
    const [videos, texts] = await Promise.all([
      base44.entities.ModelingVideo.filter({ modeling_id: modelingId }),
      base44.entities.ModelingText.filter({ modeling_id: modelingId })
    ]);

    const totalChars = 
      (videos.reduce((acc, v) => acc + (v.character_count || 0), 0)) +
      (texts.reduce((acc, t) => acc + (t.character_count || 0), 0));

    const totalTokens = 
      (videos.reduce((acc, v) => acc + (v.token_estimate || 0), 0)) +
      (texts.reduce((acc, t) => acc + (t.token_estimate || 0), 0));

    await base44.entities.Modeling.update(modelingId, {
      total_characters: totalChars,
      total_tokens_estimate: totalTokens
    });
    console.log(`[ModelingTranscribe] Updated totals for modeling ${modelingId}: ${totalTokens} tokens`);
  } catch (err) {
    console.error('[ModelingTranscribe] Failed to update totals:', err);
    // Não lança erro para não falhar a request principal se for apenas update de totais
  }
}