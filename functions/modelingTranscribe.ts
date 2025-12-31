import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RAPIDAPI_HOST = 'youtube-transcriptor.p.rapidapi.com';

async function getYoutubeTranscript(videoUrl, apiKey) {
  // Extract video ID from URL
  const urlObj = new URL(videoUrl);
  let videoId;
  
  if (urlObj.hostname.includes('youtu.be')) {
    videoId = urlObj.pathname.slice(1);
  } else {
    videoId = urlObj.searchParams.get('v');
  }
  
  if (!videoId) {
    throw new Error('ID do vídeo não encontrado na URL');
  }

  const response = await fetch(
    `https://${RAPIDAPI_HOST}/transcript?video_id=${videoId}&lang=pt`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    }
  );

  if (!response.ok) {
    // Try English if Portuguese fails
    const responseEn = await fetch(
      `https://${RAPIDAPI_HOST}/transcript?video_id=${videoId}&lang=en`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
      }
    );
    
    if (!responseEn.ok) {
      throw new Error(`Erro ao buscar transcrição: ${response.status}`);
    }
    
    return await responseEn.json();
  }

  return await response.json();
}

function parseTranscript(data) {
  // The API returns an array of transcript segments
  if (Array.isArray(data)) {
    return data.map(segment => segment.text || segment.subtitle || '').join(' ');
  }
  
  // Or it might be in a nested structure
  if (data.transcription) {
    if (Array.isArray(data.transcription)) {
      return data.transcription.map(s => s.text || '').join(' ');
    }
    return data.transcription;
  }
  
  if (data.transcript) {
    if (Array.isArray(data.transcript)) {
      return data.transcript.map(s => s.text || '').join(' ');
    }
    return data.transcript;
  }
  
  throw new Error('Formato de transcrição não reconhecido');
}

async function updateModelingTotals(base44, modelingId) {
  // Get all videos and texts for this modeling
  const [videos, texts] = await Promise.all([
    base44.asServiceRole.entities.ModelingVideo.filter({ modeling_id: modelingId }),
    base44.asServiceRole.entities.ModelingText.filter({ modeling_id: modelingId })
  ]);

  // Calculate totals from transcribed videos
  const videoStats = videos
    .filter(v => v.status === 'transcribed')
    .reduce((acc, v) => ({
      chars: acc.chars + (v.character_count || 0),
      tokens: acc.tokens + (v.token_estimate || 0)
    }), { chars: 0, tokens: 0 });

  // Calculate totals from texts
  const textStats = texts.reduce((acc, t) => ({
    chars: acc.chars + (t.character_count || 0),
    tokens: acc.tokens + (t.token_estimate || 0)
  }), { chars: 0, tokens: 0 });

  // Update modeling with totals
  await base44.asServiceRole.entities.Modeling.update(modelingId, {
    total_characters: videoStats.chars + textStats.chars,
    total_tokens_estimate: videoStats.tokens + textStats.tokens,
    video_count: videos.length,
    text_count: texts.length
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { action, videoId, modelingId } = body;

    // Action: Update totals only
    if (action === 'updateTotals' && modelingId) {
      await updateModelingTotals(base44, modelingId);
      return Response.json({ success: true });
    }

    // Action: Transcribe video
    if (action === 'transcribe' && videoId) {
      const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
      if (!rapidApiKey) {
        return Response.json({ error: 'RAPIDAPI_KEY não configurada' }, { status: 500 });
      }

      // Get video
      const video = await base44.asServiceRole.entities.ModelingVideo.get(videoId);
      if (!video) {
        return Response.json({ error: 'Vídeo não encontrado' }, { status: 404 });
      }

      // Update status to transcribing
      await base44.asServiceRole.entities.ModelingVideo.update(videoId, {
        status: 'transcribing'
      });

      try {
        // Get transcript
        const transcriptData = await getYoutubeTranscript(video.url, rapidApiKey);
        const transcript = parseTranscript(transcriptData);

        if (!transcript || transcript.trim().length === 0) {
          throw new Error('Transcrição vazia ou não disponível');
        }

        // Calculate stats
        const characterCount = transcript.length;
        const tokenEstimate = Math.ceil(characterCount / 4); // Rough estimate

        // Update video with transcript
        await base44.asServiceRole.entities.ModelingVideo.update(videoId, {
          status: 'transcribed',
          transcript: transcript,
          character_count: characterCount,
          token_estimate: tokenEstimate,
          error_message: null
        });

        // Update modeling totals
        await updateModelingTotals(base44, video.modeling_id);

        return Response.json({ 
          success: true, 
          characterCount, 
          tokenEstimate 
        });

      } catch (transcribeError) {
        // Update video with error
        await base44.asServiceRole.entities.ModelingVideo.update(videoId, {
          status: 'error',
          error_message: transcribeError.message
        });

        return Response.json({ error: transcribeError.message }, { status: 400 });
      }
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});