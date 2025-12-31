import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { YoutubeTranscript } from 'npm:youtube-transcript';

/**
 * Backend function para transcrever vídeos e atualizar totais de modelagem
 * Ações:
 * - transcribe: Baixa legenda do YouTube e processa com IA
 * - updateTotals: Recalcula tokens e caracteres da modelagem
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // --- AÇÃO: TRANSCRIBE ---
    if (action === 'transcribe') {
      const { videoId } = body;
      if (!videoId) throw new Error('videoId is required');

      // 1. Buscar dados do vídeo
      const video = await base44.entities.ModelingVideo.get(videoId);
      if (!video) throw new Error('Vídeo não encontrado');

      // 2. Buscar configurações (API Key e Agente)
      const userConfigs = await base44.entities.UserConfig.filter({});
      const userConfig = userConfigs[0];
      
      if (!userConfig?.openrouter_api_key) {
        throw new Error('API Key do OpenRouter não configurada em Configurações.');
      }

      const agentConfigs = await base44.entities.ModelingConfig.filter({});
      const agentConfig = agentConfigs[0] || {};
      
      const model = agentConfig.model || 'openai/gpt-4o-mini';
      const systemPrompt = agentConfig.prompt || 
        'Você é um especialista em transcrição. Corrija, pontue e formate o texto abaixo mantendo o tom original. Retorne APENAS o texto limpo.';

      // 3. Baixar legenda do YouTube (Raw)
      console.log(`[modelingTranscribe] Fetching transcript for: ${video.url}`);
      let rawTranscript = '';
      try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(video.url);
        rawTranscript = transcriptItems.map(item => item.text).join(' ');
      } catch (err) {
        console.error('[modelingTranscribe] YoutubeTranscript error:', err);
        throw new Error(`Erro ao obter legenda do YouTube: ${err.message}. Verifique se o vídeo tem legendas disponíveis.`);
      }

      if (!rawTranscript) {
        throw new Error('Nenhuma legenda encontrada para este vídeo.');
      }

      // 4. Processar com OpenRouter (Limpeza/Formatação)
      console.log(`[modelingTranscribe] Processing with model: ${model}`);
      
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
            { role: 'user', content: `Transcreva e formate o seguinte texto:\n\n${rawTranscript}` }
          ]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter error: ${errorText}`);
      }

      const data = await response.json();
      const processedTranscript = data.choices?.[0]?.message?.content || rawTranscript;

      // 5. Atualizar registro do vídeo
      const charCount = processedTranscript.length;
      const tokenEst = Math.ceil(charCount / 4);

      await base44.entities.ModelingVideo.update(video.id, {
        transcript: processedTranscript,
        status: 'transcribed',
        character_count: charCount,
        token_estimate: tokenEst,
        updated_date: new Date().toISOString() // Force update trigger
      });

      // 6. Log de uso
      await base44.entities.UsageLog.create({
        user_email: user.email,
        feature: 'modeling_transcribe',
        model: model,
        model_name: agentConfig.model_name || model,
        total_tokens: data.usage?.total_tokens || 0,
        duration_ms: 0, // Simplificado
        success: true
      });

      return Response.json({ success: true, transcript: processedTranscript });
    }

    // --- AÇÃO: UPDATE TOTALS ---
    if (action === 'updateTotals') {
      const { modelingId } = body;
      if (!modelingId) throw new Error('modelingId is required');

      const [videos, texts] = await Promise.all([
        base44.entities.ModelingVideo.filter({ modeling_id: modelingId }),
        base44.entities.ModelingText.filter({ modeling_id: modelingId })
      ]);

      const totalChars = (videos.reduce((acc, v) => acc + (v.character_count || 0), 0)) + 
                         (texts.reduce((acc, t) => acc + (t.character_count || 0), 0));
      
      const totalTokens = (videos.reduce((acc, v) => acc + (v.token_estimate || 0), 0)) +
                          (texts.reduce((acc, t) => acc + (t.token_estimate || 0), 0));

      await base44.entities.Modeling.update(modelingId, {
        total_characters: totalChars,
        total_tokens: totalTokens
      });

      return Response.json({ success: true, totalChars, totalTokens });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('[modelingTranscribe] Error:', error);
    
    // Tenta atualizar status para erro se for ação de transcrição e tiver ID
    try {
      const body = await req.json().catch(() => ({}));
      if (body.action === 'transcribe' && body.videoId) {
        const base44 = createClientFromRequest(req);
        await base44.entities.ModelingVideo.update(body.videoId, {
          status: 'error',
          error_message: error.message
        });
      }
    } catch (e) { /* ignore secondary error */ }

    return Response.json({ error: error.message }, { status: 500 });
  }
});