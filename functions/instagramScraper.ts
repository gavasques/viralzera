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

      // Usar Instagram GraphQL público (sem API key necessária)
      const instagramUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
      
      let response = await fetch(instagramUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.instagram.com/',
          'X-IG-App-ID': '936619743392459',
        }
      });

      // Se GraphQL falhar, tentar RapidAPI
      if (!response.ok) {
        console.log('GraphQL failed, trying RapidAPI...');
        response = await fetch(
          `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${shortcode}`,
          {
            method: 'GET',
            headers: {
              'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
              'x-rapidapi-key': RAPIDAPI_KEY
            }
          }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Instagram API error:', response.status, errorText);
        return Response.json({ error: `Não foi possível acessar o post. O Instagram pode estar bloqueando. Tente novamente mais tarde.` });
      }

      const result = await response.json();
      console.log('Instagram API response keys:', Object.keys(result));
      
      // Processar dados - suporta múltiplos formatos de resposta
      let data = result.graphql?.shortcode_media || result.items?.[0] || result.data || result;

      if (!data) {
        return Response.json({ error: 'Post não encontrado ou privado' });
      }

      // Processar imagens - suporta múltiplos formatos
      let images = [];
      
      // Formato GraphQL - Carrossel
      if (data.edge_sidecar_to_children?.edges) {
        images = data.edge_sidecar_to_children.edges.map((edge, idx) => ({
          url: edge.node.display_url || edge.node.display_resources?.[0]?.src,
          width: edge.node.dimensions?.width,
          height: edge.node.dimensions?.height,
          index: idx
        }));
      }
      // Formato API - Carrossel
      else if (data.carousel_media) {
        images = data.carousel_media.map((item, idx) => ({
          url: item.image_versions2?.candidates?.[0]?.url || item.display_url || item.thumbnail_url,
          width: item.image_versions2?.candidates?.[0]?.width || item.original_width,
          height: item.image_versions2?.candidates?.[0]?.height || item.original_height,
          index: idx
        }));
      }
      // Post único - GraphQL
      else if (data.display_url) {
        images = [{
          url: data.display_url,
          width: data.dimensions?.width,
          height: data.dimensions?.height,
          index: 0
        }];
      }
      // Post único - API
      else if (data.image_versions2?.candidates?.[0]) {
        images = [{
          url: data.image_versions2.candidates[0].url,
          width: data.image_versions2.candidates[0].width,
          height: data.image_versions2.candidates[0].height,
          index: 0
        }];
      }
      // Fallback thumbnail
      else if (data.thumbnail_url) {
        images = [{
          url: data.thumbnail_url,
          width: data.original_width,
          height: data.original_height,
          index: 0
        }];
      }

      const postData = {
        id: data.id || data.pk,
        shortcode: data.shortcode || data.code || shortcode,
        caption: data.edge_media_to_caption?.edges?.[0]?.node?.text || data.caption?.text || '',
        title: data.title || '',
        likes: data.edge_media_preview_like?.count || data.like_count || 0,
        comments: data.edge_media_to_comment?.count || data.comment_count || 0,
        views: data.video_view_count || data.play_count || 0,
        username: data.owner?.username || data.user?.username || '',
        user_full_name: data.owner?.full_name || data.user?.full_name || '',
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