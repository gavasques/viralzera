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

      // Scraping direto da página do Instagram
      const postUrl = `https://www.instagram.com/p/${shortcode}/`;
      
      const response = await fetch(postUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        console.error('Instagram fetch error:', response.status);
        return Response.json({ error: `Não foi possível acessar o post. Status: ${response.status}` });
      }

      const html = await response.text();
      console.log('HTML length:', html.length);
      
      // Extrair dados do JSON embutido na página
      let data = null;
      
      // Método 1: Buscar no script com __additionalDataLoaded
      const additionalDataMatch = html.match(/__additionalDataLoaded\s*\(\s*['"][^'"]+['"]\s*,\s*({.+?})\s*\)\s*;/s);
      if (additionalDataMatch) {
        try {
          const parsed = JSON.parse(additionalDataMatch[1]);
          data = parsed.graphql?.shortcode_media || parsed.items?.[0];
          console.log('Found data via additionalDataLoaded');
        } catch (e) {
          console.log('additionalDataLoaded parse error:', e.message);
        }
      }
      
      // Método 2: Buscar no script type="application/ld+json"
      if (!data) {
        const ldJsonMatch = html.match(/<script type="application\/ld\+json"[^>]*>({.+?})<\/script>/s);
        if (ldJsonMatch) {
          try {
            const ldData = JSON.parse(ldJsonMatch[1]);
            console.log('Found LD+JSON data');
            // LD+JSON tem formato diferente
            if (ldData.image || ldData.video) {
              data = {
                __ldJson: true,
                image: ldData.image,
                video: ldData.video,
                caption: ldData.caption || ldData.articleBody || '',
                author: ldData.author?.identifier?.value || ldData.author?.name || '',
                interactionCount: ldData.interactionStatistic?.userInteractionCount || 0
              };
            }
          } catch (e) {
            console.log('LD+JSON parse error:', e.message);
          }
        }
      }
      
      // Método 3: Buscar dados em window._sharedData ou window.__initialData
      if (!data) {
        const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});<\/script>/s);
        if (sharedDataMatch) {
          try {
            const shared = JSON.parse(sharedDataMatch[1]);
            data = shared.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
            console.log('Found data via _sharedData');
          } catch (e) {
            console.log('_sharedData parse error:', e.message);
          }
        }
      }
      
      // Método 4: Buscar meta tags como fallback
      if (!data) {
        console.log('Using meta tags fallback');
        const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
        const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1];
        const ogDescription = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1];
        const ogVideo = html.match(/<meta property="og:video" content="([^"]+)"/)?.[1];
        
        if (ogImage || ogVideo) {
          data = {
            __metaTags: true,
            image: ogImage,
            video: ogVideo,
            title: ogTitle,
            description: ogDescription
          };
        }
      }

      if (!data) {
        console.log('No data found in HTML');
        // Log uma amostra do HTML para debug
        console.log('HTML sample:', html.substring(0, 2000));
        return Response.json({ error: 'Não foi possível extrair dados do post. O Instagram pode estar bloqueando ou o post é privado.' });
      }

      // Processar dados baseado no formato encontrado
      let images = [];
      let caption = '';
      let username = '';
      let likes = 0;
      let comments = 0;
      let views = 0;

      if (data.__metaTags) {
        // Dados de meta tags
        if (data.image) {
          images = [{ url: data.image, index: 0 }];
        }
        caption = data.description || '';
        // Tentar extrair username do título "username on Instagram..."
        const usernameMatch = data.title?.match(/^([^@\s]+)\s+on Instagram/i);
        username = usernameMatch?.[1] || '';
      } else if (data.__ldJson) {
        // Dados de LD+JSON
        const imgUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        if (imgUrl) {
          images = [{ url: imgUrl, index: 0 }];
        }
        caption = data.caption || '';
        username = data.author || '';
        views = data.interactionCount || 0;
      } else {
        // Dados do GraphQL/API
        // Carrossel
        if (data.edge_sidecar_to_children?.edges) {
          images = data.edge_sidecar_to_children.edges.map((edge, idx) => ({
            url: edge.node.display_url,
            width: edge.node.dimensions?.width,
            height: edge.node.dimensions?.height,
            index: idx
          }));
        }
        // Post único
        else if (data.display_url) {
          images = [{
            url: data.display_url,
            width: data.dimensions?.width,
            height: data.dimensions?.height,
            index: 0
          }];
        }
        
        caption = data.edge_media_to_caption?.edges?.[0]?.node?.text || data.caption?.text || '';
        username = data.owner?.username || '';
        likes = data.edge_media_preview_like?.count || data.like_count || 0;
        comments = data.edge_media_to_comment?.count || data.comment_count || 0;
        views = data.video_view_count || data.play_count || 0;
      }

      const postData = {
        id: data.id || data.pk || shortcode,
        shortcode: shortcode,
        caption: caption,
        title: data.title || '',
        likes: likes,
        comments: comments,
        views: views,
        username: username,
        user_full_name: data.owner?.full_name || '',
        images: images,
        source: data.__metaTags ? 'meta_tags' : data.__ldJson ? 'ld_json' : 'graphql'
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