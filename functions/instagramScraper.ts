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

      // Método 1: Tentar via embed do Instagram
      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
      console.log('Trying embed URL:', embedUrl);
      
      let images = [];
      let caption = '';
      let username = '';
      let likes = 0;
      let comments = 0;
      let views = 0;
      let videoVersions = [];

      const response = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });

      if (response.ok) {
        const html = await response.text();
        console.log('Embed HTML length:', html.length);
        
        // Extrair imagem do embed - múltiplas tentativas
        const imgPatterns = [
          /class="EmbeddedMediaImage"[^>]*src="([^"]+)"/,
          /<img[^>]+src="(https:\/\/[^"]*scontent[^"]+)"/,
          /background-image:\s*url\(['"]?(https:\/\/[^'")\s]+)['"]?\)/,
          /"display_url":"([^"]+)"/,
          /"thumbnail_src":"([^"]+)"/
        ];
        
        for (const pattern of imgPatterns) {
          const match = html.match(pattern);
          if (match?.[1]) {
            let imgUrl = match[1].replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
            if (imgUrl && !images.some(i => i.url === imgUrl)) {
              images.push({ url: imgUrl, index: images.length });
              console.log('Found image via pattern:', pattern.toString().substring(0, 50));
            }
          }
        }

        // Extrair múltiplas imagens para carrossel
        const allImgMatches = html.matchAll(/"display_url":"([^"]+)"/g);
        for (const match of allImgMatches) {
          const imgUrl = match[1].replace(/\\u0026/g, '&');
          if (!images.some(i => i.url === imgUrl)) {
            images.push({ url: imgUrl, index: images.length });
          }
        }

        // Extrair caption
        const captionPatterns = [
          /"text":"([^"]+)"/,
          /class="Caption"[^>]*>([\s\S]*?)<\/div>/,
          /"edge_media_to_caption":\{"edges":\[\{"node":\{"text":"([^"]+)"/
        ];
        
        for (const pattern of captionPatterns) {
          const match = html.match(pattern);
          if (match?.[1] && !caption) {
            caption = match[1].replace(/<[^>]+>/g, ' ').replace(/\\n/g, '\n').replace(/\s+/g, ' ').trim();
          }
        }

        // Extrair username
        const userPatterns = [
          /"username":"([^"]+)"/,
          /class="UsernameText"[^>]*>([^<]+)</
        ];
        
        for (const pattern of userPatterns) {
          const match = html.match(pattern);
          if (match?.[1] && !username) {
            username = match[1];
          }
        }

        // Extrair métricas
        const likesMatch = html.match(/"edge_media_preview_like":\{"count":(\d+)/);
        const commentsMatch = html.match(/"edge_media_to_comment":\{"count":(\d+)/);
        const viewsMatch = html.match(/"video_view_count":(\d+)/);
        
        likes = likesMatch ? parseInt(likesMatch[1]) : 0;
        comments = commentsMatch ? parseInt(commentsMatch[1]) : 0;
        views = viewsMatch ? parseInt(viewsMatch[1]) : 0;

        // Extrair video versions para reels
        const videoMatch = html.match(/"video_url":"([^"]+)"/);
        if (videoMatch?.[1]) {
          videoVersions.push({ url: videoMatch[1].replace(/\\u0026/g, '&') });
        }
      }

      // Método 2: Se não encontrou nada, tentar página direta
      if (images.length === 0) {
        console.log('Embed failed, trying direct page...');
        
        const directUrl = `https://www.instagram.com/p/${shortcode}/`;
        const directResponse = await fetch(directUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml',
          }
        });

        if (directResponse.ok) {
          const html = await directResponse.text();
          console.log('Direct page HTML length:', html.length);
          
          // Buscar og:image
          const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
          const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1];
          
          if (ogImage) {
            images.push({ url: ogImage.replace(/&amp;/g, '&'), index: 0 });
          }
          
          if (ogDesc && !caption) {
            // Extrair caption do og:description (formato: "X likes, Y comments - CAPTION")
            const captionMatch = ogDesc.match(/comments?\s*-\s*(.+)/i);
            caption = captionMatch?.[1] || ogDesc;
            caption = caption.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
          }
        }
      }

      if (images.length === 0 && !caption) {
        console.log('All methods failed to extract data');
        return Response.json({ error: 'Não foi possível extrair dados do post. O Instagram pode estar bloqueando ou o post é privado.' });
      }

      const postData = {
        id: shortcode,
        shortcode: shortcode,
        caption: caption,
        title: '',
        likes: likes,
        comments: comments,
        views: views,
        username: username,
        user_full_name: '',
        images: images,
        raw: videoVersions.length > 0 ? { video_versions: videoVersions } : null,
        source: 'embed'
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