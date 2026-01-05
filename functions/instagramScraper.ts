import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, url, imageUrls, videoUrl } = await req.json();
    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

    if (!RAPIDAPI_KEY) {
      return Response.json({ error: 'RAPIDAPI_KEY não configurada' }, { status: 500 });
    }

    // ========== GET POST DETAILS ==========
    if (action === 'getPostDetails') {
      // Extrair shortcode da URL
      const shortcodeMatch = url.match(/(?:\/p\/|\/reel\/|\/reels\/)([A-Za-z0-9_-]+)/);
      if (!shortcodeMatch) {
        return Response.json({ error: 'URL do Instagram inválida' });
      }
      const shortcode = shortcodeMatch[1];

      // Tentar Instagram191 API primeiro (mais estável)
      const response = await fetch(
        `https://instagram191.p.rapidapi.com/v2/post/by/shortcode?shortcode=${shortcode}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'instagram191.p.rapidapi.com',
            'x-rapidapi-key': RAPIDAPI_KEY
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RapidAPI error:', response.status, errorText);
        return Response.json({ error: `Erro na API do Instagram: ${response.status}` });
      }

      const result = await response.json();
      console.log('Instagram API response:', JSON.stringify(result).substring(0, 1000));
      
      // Instagram191 retorna estrutura diferente
      const data = result.data || result;

      if (!data || result.error) {
        return Response.json({ error: result.message || 'Post não encontrado' });
      }

      // Processar imagens - Instagram191 usa estrutura diferente
      let images = [];
      
      // Carrossel
      if (data.carousel_media_count > 0 && data.carousel_media) {
        images = data.carousel_media.map((item, idx) => ({
          url: item.image_versions2?.candidates?.[0]?.url || item.display_url || item.thumbnail_url,
          width: item.image_versions2?.candidates?.[0]?.width || item.original_width,
          height: item.image_versions2?.candidates?.[0]?.height || item.original_height,
          index: idx
        }));
      } 
      // Post único ou Reel
      else if (data.image_versions2?.candidates?.[0]) {
        images = [{
          url: data.image_versions2.candidates[0].url,
          width: data.image_versions2.candidates[0].width,
          height: data.image_versions2.candidates[0].height,
          index: 0
        }];
      } else if (data.display_url) {
        images = [{
          url: data.display_url,
          width: data.original_width,
          height: data.original_height,
          index: 0
        }];
      } else if (data.thumbnail_url) {
        images = [{
          url: data.thumbnail_url,
          width: data.original_width,
          height: data.original_height,
          index: 0
        }];
      }

      const postData = {
        id: data.id || data.pk,
        shortcode: data.code || shortcode,
        caption: data.caption?.text || data.edge_media_to_caption?.edges?.[0]?.node?.text || '',
        title: data.title || '',
        likes: data.like_count || data.edge_liked_by?.count || 0,
        comments: data.comment_count || data.edge_media_to_comment?.count || 0,
        views: data.play_count || data.video_play_count || data.video_view_count || 0,
        username: data.user?.username || data.owner?.username || '',
        user_full_name: data.user?.full_name || data.owner?.full_name || '',
        images: images,
        raw: data
      };

      return Response.json(postData);
    }

    // ========== EXTRACT TEXT FROM IMAGES (OCR) ==========
    if (action === 'extractTextFromImages') {
      if (!imageUrls || imageUrls.length === 0) {
        return Response.json({ error: 'Nenhuma imagem fornecida' });
      }

      // Usar InvokeLLM com vision para OCR
      const extractedTexts = [];

      for (let i = 0; i < imageUrls.length; i++) {
        try {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Extraia TODO o texto visível nesta imagem. Retorne apenas o texto encontrado, sem explicações. Se não houver texto, responda "SEM TEXTO".`,
            file_urls: [imageUrls[i]],
          });

          extractedTexts.push({
            index: i,
            text: typeof result === 'string' ? result : result.content || 'SEM TEXTO'
          });
        } catch (err) {
          console.error(`Erro ao extrair texto da imagem ${i}:`, err);
          extractedTexts.push({ index: i, text: 'ERRO NA EXTRAÇÃO' });
        }
      }

      return Response.json({ extractedTexts });
    }

    // ========== TRANSCRIBE VIDEO ==========
    if (action === 'transcribeVideo') {
      if (!videoUrl) {
        return Response.json({ error: 'URL do vídeo não fornecida' });
      }

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Transcreva o áudio deste vídeo. Retorne apenas a transcrição do que é falado, sem explicações adicionais. Se não houver áudio falado, responda "SEM ÁUDIO FALADO".`,
          file_urls: [videoUrl],
        });

        return Response.json({ 
          transcription: typeof result === 'string' ? result : result.content || 'SEM ÁUDIO FALADO' 
        });
      } catch (err) {
        console.error('Erro ao transcrever vídeo:', err);
        return Response.json({ error: 'Erro ao transcrever vídeo: ' + err.message });
      }
    }

    return Response.json({ error: 'Ação não reconhecida' });

  } catch (error) {
    console.error('instagramScraper error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});