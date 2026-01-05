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

      // Usar RapidAPI para buscar dados do post
      const apiUrl = `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${shortcode}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      });

      if (!response.ok) {
        console.error('RapidAPI error:', response.status);
        const errorText = await response.text();
        console.error('RapidAPI error body:', errorText);
        return Response.json({ error: `Erro na API do Instagram. Status: ${response.status}` });
      }

      const apiData = await response.json();
      console.log('RapidAPI response keys:', Object.keys(apiData));

      if (!apiData.data) {
        console.log('No data in API response:', JSON.stringify(apiData).substring(0, 500));
        return Response.json({ error: 'Post não encontrado ou privado' });
      }

      const data = apiData.data;
      
      // Processar imagens
      let images = [];
      
      // Carrossel
      if (data.carousel_media && data.carousel_media.length > 0) {
        images = data.carousel_media.map((item, idx) => ({
          url: item.image_versions?.items?.[0]?.url || item.thumbnail_url || '',
          width: item.image_versions?.items?.[0]?.width || item.original_width,
          height: item.image_versions?.items?.[0]?.height || item.original_height,
          index: idx
        }));
      }
      // Post/Reel único
      else if (data.image_versions?.items?.length > 0) {
        images = [{
          url: data.image_versions.items[0].url,
          width: data.image_versions.items[0].width,
          height: data.image_versions.items[0].height,
          index: 0
        }];
      }
      // Thumbnail do vídeo
      else if (data.thumbnail_url) {
        images = [{
          url: data.thumbnail_url,
          index: 0
        }];
      }

      const postData = {
        id: data.id || data.pk || shortcode,
        shortcode: shortcode,
        caption: data.caption?.text || '',
        title: data.title || '',
        likes: data.like_count || 0,
        comments: data.comment_count || 0,
        views: data.play_count || data.view_count || 0,
        username: data.user?.username || '',
        user_full_name: data.user?.full_name || '',
        images: images,
        raw: data, // Para acesso a video_versions etc
        source: 'rapidapi'
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