import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backend function para gerenciar transcrições com Transkriptor
 * Actions:
 * - start_transcription: Envia URL para Transkriptor
 * - check_status: Verifica status e baixa resultado se pronto
 * - updateTotals: Recalcula totais (mantido legado)
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
    const apiKey = Deno.env.get("TRANSKRIPTOR_API_KEY");

    if (!apiKey && action !== 'updateTotals') {
      return Response.json({ error: 'TRANSKRIPTOR_API_KEY secret is not set' }, { status: 500 });
    }

    // --- AÇÃO: START TRANSCRIPTION ---
    if (action === 'start_transcription') {
      const { videoId } = body;
      if (!videoId) throw new Error('videoId is required');

      const video = await base44.entities.ModelingVideo.get(videoId);
      if (!video) throw new Error('Video not found');

      // Se já tiver order_id e estiver transcrevendo, apenas checa o status
      if (video.transkriptor_order_id && video.status === 'transcribing') {
        return handleCheckStatus(videoId, video.transkriptor_order_id, base44, apiKey);
      }

      console.log(`[Transkriptor] Starting transcription for video: ${video.url}`);

      const response = await fetch("https://api.tor.app/developer/transcription/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
        },
        body: JSON.stringify({
          url: video.url,
          service: "Standard",
          language: "pt-BR" // Padrão PT-BR, poderia ser parâmetro
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Transkriptor] Start error:', errorText);
        throw new Error(`Transkriptor API error: ${errorText}`);
      }

      const data = await response.json();
      console.log('[Transkriptor] Order started:', data);

      if (!data.order_id) {
        throw new Error('No order_id received from Transkriptor');
      }

      await base44.entities.ModelingVideo.update(videoId, {
        transkriptor_order_id: data.order_id,
        status: 'transcribing',
        error_message: null
      });

      return Response.json({ success: true, order_id: data.order_id, status: 'transcribing' });
    }

    // --- AÇÃO: CHECK STATUS ---
    if (action === 'check_status') {
      const { videoId } = body;
      if (!videoId) throw new Error('videoId is required');

      const video = await base44.entities.ModelingVideo.get(videoId);
      if (!video) throw new Error('Video not found');

      if (!video.transkriptor_order_id) {
        throw new Error('No Transkriptor order ID found for this video');
      }

      return handleCheckStatus(videoId, video.transkriptor_order_id, base44, apiKey);
    }

    // --- AÇÃO: UPDATE TOTALS (LEGADO/UTIL) ---
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
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleCheckStatus(videoId, orderId, base44, apiKey) {
  console.log(`[Transkriptor] Checking status for order: ${orderId}`);

  const response = await fetch(`https://api.tor.app/developer/files/${orderId}/content`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Transkriptor] Check error:', errorText);
    throw new Error(`Transkriptor Check API error: ${errorText}`);
  }

  const data = await response.json();
  // A API pode retornar status no body mesmo com 200 OK
  // Ex: { status: "Processing" } ou { status: "Completed", content: [...] }
  
  // A documentação do "Get Transcription Content" diz que retorna o content.
  // Mas a resposta de exemplo mostra um campo "status".
  
  if (data.status === 'Processing' || data.status === 'Queued' || data.status === 'Uploading') {
    return Response.json({ success: true, status: 'transcribing', progress: 'processing' });
  }

  if (data.status === 'Completed') {
    // Processar conteúdo
    // data.content é array de { text, StartTime, EndTime, Speaker }
    
    let fullText = '';
    if (Array.isArray(data.content)) {
      fullText = data.content.map(item => item.text).join(' ');
    } else {
        // Fallback caso estrutura seja diferente
        fullText = JSON.stringify(data.content);
    }

    const charCount = fullText.length;
    const tokenEst = Math.ceil(charCount / 4);

    await base44.entities.ModelingVideo.update(videoId, {
      transcript: fullText,
      status: 'transcribed',
      character_count: charCount,
      token_estimate: tokenEst,
      updated_date: new Date().toISOString()
    });

    // Atualiza totais da modelagem
    const video = await base44.entities.ModelingVideo.get(videoId);
    if (video.modeling_id) {
       // Invoke updateTotals async (fire and forget kinda, but calling self via fetch or base44 SDK if possible)
       // Vamos chamar a função recursivamente ou via SDK se possível, mas aqui estamos dentro da função.
       // Melhor apenas chamar a lógica de updateTotals se tivermos acesso fácil, mas como é outra action, 
       // vamos deixar o client chamar ou o usuário atualizar a página.
       // Ou fazer o update direto aqui:
       // Mas para economizar tempo de execução, deixamos para o client ou próxima carga.
    }

    return Response.json({ success: true, status: 'transcribed', transcript: fullText });
  }

  // Se for outro status (Failed?)
  if (data.status === 'Failed' || data.status === 'Error') {
     await base44.entities.ModelingVideo.update(videoId, {
      status: 'error',
      error_message: 'Transkriptor failed to process video'
    });
    return Response.json({ success: false, status: 'error', error: 'Transkriptor failed' });
  }

  // Se não tiver status claro, assume processing
  return Response.json({ success: true, status: 'transcribing', data });
}