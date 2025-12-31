import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, videoId, modelingId } = await req.json();

    // Action: transcribe a YouTube video
    if (action === 'transcribe') {
      if (!videoId) {
        return Response.json({ error: 'videoId é obrigatório' }, { status: 400 });
      }

      // Fetch video data
      const video = await base44.entities.ModelingVideo.get(videoId);
      if (!video) {
        return Response.json({ error: 'Vídeo não encontrado' }, { status: 404 });
      }

      // Update status to transcribing
      await base44.entities.ModelingVideo.update(videoId, { 
        status: 'transcribing',
        error_message: null
      });

      try {
        // Get user's OpenRouter API Key
        const configs = await base44.entities.UserConfig.filter({ created_by: user.email });
        const apiKey = configs[0]?.openrouter_api_key;

        if (!apiKey) {
          throw new Error('Configure sua API Key do OpenRouter em Configurações');
        }

        // Get ModelingConfig to get the model
        const modelingConfigs = await base44.asServiceRole.entities.ModelingConfig.list();
        const modelingConfig = modelingConfigs[0];
        const model = modelingConfig?.model || 'google/gemini-2.0-flash-exp:free';

        // Call OpenRouter with YouTube URL
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://viralmania.app',
            'X-Title': 'ViralMania - Modelagem'
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Por favor, transcreva completamente este vídeo do YouTube. Mantenha a fala natural, gírias, expressões coloquiais (tipo, né, mano, tá ligado, etc.), pausas marcadas como [PAUSA], risos como [RISOS]. Não reescreva em português formal - preserve a voz original do criador.'
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
          throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
        }

        const data = await response.json();

        if (!data.choices?.[0]?.message?.content) {
          throw new Error('Resposta inválida da IA');
        }

        const transcript = data.choices[0].message.content;
        const characterCount = transcript.length;
        const tokenEstimate = Math.ceil(characterCount / 4);

        // Update video with transcript
        await base44.entities.ModelingVideo.update(videoId, {
          transcript,
          character_count: characterCount,
          token_estimate: tokenEstimate,
          status: 'transcribed',
          error_message: null
        });

        // Update modeling totals
        const modeling = await base44.entities.Modeling.get(video.modeling_id);
        if (modeling) {
          const allVideos = await base44.entities.ModelingVideo.filter({ 
            modeling_id: video.modeling_id 
          });
          const allTexts = await base44.entities.ModelingText.filter({ 
            modeling_id: video.modeling_id 
          });

          const totalChars = allVideos.reduce((sum, v) => sum + (v.character_count || 0), 0) +
                            allTexts.reduce((sum, t) => sum + (t.character_count || 0), 0);
          const totalTokens = Math.ceil(totalChars / 4);

          await base44.entities.Modeling.update(video.modeling_id, {
            total_characters: totalChars,
            total_tokens_estimate: totalTokens
          });
        }

        return Response.json({ 
          success: true, 
          transcript,
          characterCount,
          tokenEstimate
        });

      } catch (error) {
        // Update video with error status
        await base44.entities.ModelingVideo.update(videoId, {
          status: 'error',
          error_message: error.message
        });

        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    // Action: update modeling totals
    if (action === 'updateTotals') {
      if (!modelingId) {
        return Response.json({ error: 'modelingId é obrigatório' }, { status: 400 });
      }

      const allVideos = await base44.entities.ModelingVideo.filter({ 
        modeling_id: modelingId 
      });
      const allTexts = await base44.entities.ModelingText.filter({ 
        modeling_id: modelingId 
      });

      const totalChars = allVideos.reduce((sum, v) => sum + (v.character_count || 0), 0) +
                        allTexts.reduce((sum, t) => sum + (t.character_count || 0), 0);
      const totalTokens = Math.ceil(totalChars / 4);

      await base44.entities.Modeling.update(modelingId, {
        total_characters: totalChars,
        total_tokens_estimate: totalTokens
      });

      return Response.json({ success: true, totalChars, totalTokens });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro em modelingTranscribe:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});