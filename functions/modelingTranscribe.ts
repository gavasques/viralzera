import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backend function para transcrever vídeos usando Transkriptor
 * Ações:
 * - transcribe: 
 *    - Se pending/error: Inicia transcrição no Transkriptor (upload url)
 *    - Se transcribing: Verifica status no Transkriptor
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

      // 2. Buscar API Key do Transkriptor (User Secret ou Variável de Ambiente)
      // O usuário setou TRANSKRIPTOR_API_KEY via set_secrets, que vai para env vars do App
      const apiKey = Deno.env.get('TRANSKRIPTOR_API_KEY');
      
      if (!apiKey) {
        throw new Error('API Key do Transkriptor não configurada (TRANSKRIPTOR_API_KEY).');
      }

      // 3. Lógica de Transcrição
      // Se já tem order_id e status é transcribing, verifica o status
      if (video.transkriptor_order_id && video.status === 'transcribing') {
        console.log(`[modelingTranscribe] Checking status for order: ${video.transkriptor_order_id}`);
        
        const checkResponse = await fetch(`https://api.tor.app/developer/files/${video.transkriptor_order_id}/content`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });

        if (!checkResponse.ok) {
           // Se der 404 ou erro, pode ser que o ID esteja errado ou expirou.
           const errText = await checkResponse.text();
           console.error(`[modelingTranscribe] Check status failed: ${checkResponse.status} - ${errText}`);
           
           // Se for erro de servidor, talvez manter transcribing? Se for 404, falhar.
           if (checkResponse.status === 404) {
             await base44.entities.ModelingVideo.update(video.id, {
               status: 'error',
               error_message: 'Pedido de transcrição não encontrado no Transkriptor.'
             });
             return Response.json({ status: 'error', message: 'Pedido não encontrado.' });
           }
           
           throw new Error(`Erro ao verificar status: ${checkResponse.status}`);
        }

        const data = await checkResponse.json();
        console.log(`[modelingTranscribe] Status response:`, JSON.stringify(data).substring(0, 200));

        // Transkriptor retorna 200 OK com body contendo "status": "Completed" ou "Processing"
        // O body pode estar dentro de um objeto "body" se for wrapper da AWS Lambda, mas a doc diz que retorna direto o JSON.
        // Vamos checar a estrutura. Doc diz:
        // { "status": "Completed", "content": [ { "text": "..." } ] }
        // Ou
        // { "status": "Processing", ... }

        const status = data.status; // "Processing", "Completed", "Failed"?

        if (status === 'Completed') {
          // Extrair texto completo
          // content é array de objetos { text, StartTime, ... }
          let fullText = '';
          if (Array.isArray(data.content)) {
            fullText = data.content.map(c => c.text).join(' ');
          } else if (typeof data.content === 'string') {
            fullText = data.content;
          }

          if (!fullText) fullText = "Transcrição vazia.";

          const charCount = fullText.length;
          const tokenEst = Math.ceil(charCount / 4);

          await base44.entities.ModelingVideo.update(video.id, {
            transcript: fullText,
            status: 'transcribed',
            character_count: charCount,
            token_estimate: tokenEst,
            updated_date: new Date().toISOString()
          });

          // Atualizar totais
          // Chamar updateTotals internamente ou deixar o frontend chamar?
          // Vamos chamar internamente para garantir.
           // Recalcular totais (simples)
           // (Ideal seria chamar a função separada, mas para evitar overhead fazemos aqui ou deixamos o front)
           // Vamos deixar o front chamar updateTotals no success.

          return Response.json({ success: true, status: 'transcribed', transcript: fullText });

        } else if (status === 'Processing' || status === 'Uploaded' || status === 'I am working on it') {
          return Response.json({ success: true, status: 'transcribing', message: 'Ainda processando...' });
        } else if (status === 'Failed' || status === 'Error') {
           await base44.entities.ModelingVideo.update(video.id, {
            status: 'error',
            error_message: 'Transkriptor falhou na transcrição.'
          });
          return Response.json({ success: false, status: 'error', message: 'Falha no processamento.' });
        } else {
           // Status desconhecido, mantém transcribing
           console.log(`[modelingTranscribe] Unknown status: ${status}`);
           return Response.json({ success: true, status: 'transcribing', message: `Status: ${status}` });
        }

      } else {
        // INICIAR NOVA TRANSCRIÇÃO
        console.log(`[modelingTranscribe] Starting new transcription for: ${video.url}`);

        // Payload para URL
        // Endpoint: https://api.tor.app/developer/transcription/url
        const payload = {
          url: video.url,
          service: "Standard",
          language: "pt-BR", // Default para PT-BR conforme contexto do app, mas ideal seria parametrizável ou auto? Doc diz language code. Vamos usar pt-BR.
          // file_name: video.title // Opcional
        };

        const startResponse = await fetch('https://api.tor.app/developer/transcription/url', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!startResponse.ok) {
           const errText = await startResponse.text();
           console.error(`[modelingTranscribe] Start transcription failed: ${startResponse.status} - ${errText}`);
           throw new Error(`Erro ao iniciar transcrição: ${startResponse.status} - ${errText}`);
        }

        const startData = await startResponse.json();
        // { "message": "...", "order_id": "..." }
        
        const orderId = startData.order_id;
        if (!orderId) {
          throw new Error('Não foi possível obter o Order ID do Transkriptor.');
        }

        // Salvar order_id e mudar status
        await base44.entities.ModelingVideo.update(video.id, {
          status: 'transcribing',
          transkriptor_order_id: orderId,
          error_message: null
        });

        // Log de uso (inicio)
        await base44.entities.UsageLog.create({
          user_email: user.email,
          feature: 'modeling_transcribe_start',
          model: 'transkriptor',
          model_name: 'Standard',
          total_tokens: 0,
          duration_ms: 0,
          success: true
        });

        return Response.json({ success: true, status: 'transcribing', orderId });
      }
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
        // Só atualiza para erro se não for erro de "ainda processando" (que não lançaria exceção acima, mas vai que)
        // Aqui é erro de código mesmo.
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