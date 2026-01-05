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

      // Usar API GraphQL pública do Instagram (via embed)
      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
      
      const response = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });

      if (!response.ok) {
        console.error('Instagram embed error:', response.status);
        return Response.json({ error: `Erro ao acessar post. Status: ${response.status}` });
      }

      const html = await response.text();
      console.log('Embed HTML length:', html.length);
      
      // Extrair dados do embed
      let images = [];
      let caption = '';
      let username = '';
      let likes = 0;
      let comments = 0;
      let views = 0;

      // Extrair imagem principal do embed
      const imgMatch = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/);
      const imgMatch2 = html.match(/<img[^>]*class="[^"]*"[^>]*src="([^"]+scontent[^"]+)"/);
      const imgMatch3 = html.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/);
      
      let mainImage = imgMatch?.[1] || imgMatch2?.[1] || imgMatch3?.[1] || '';
      
      // Decodificar entidades HTML
      mainImage = mainImage.replace(/&amp;/g, '&');
      
      if (mainImage) {
        images = [{ url: mainImage, index: 0 }];
      }

      // Extrair caption do embed
      const captionMatch = html.match(/class="Caption"[^>]*>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/);
      const captionMatch2 = html.match(/<div class="CaptionComments"[^>]*>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/);
      caption = captionMatch?.[1] || captionMatch2?.[1] || '';
      // Limpar HTML do caption
      caption = caption.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      // Extrair username
      const userMatch = html.match(/class="UsernameText"[^>]*>([^<]+)</);
      const userMatch2 = html.match(/"username":"([^"]+)"/);
      username = userMatch?.[1] || userMatch2?.[1] || '';

      // Tentar extrair dados do script embutido
      const scriptMatch = html.match(/window\.__additionalDataLoaded\s*\(\s*['"][^'"]+['"]\s*,\s*(\{[\s\S]+?\})\s*\)\s*;/);
      if (scriptMatch) {
        try {
          const data = JSON.parse(scriptMatch[1]);
          const media = data.shortcode_media || data;
          
          if (media.edge_sidecar_to_children?.edges) {
            images = media.edge_sidecar_to_children.edges.map((edge, idx) => ({
              url: edge.node.display_url,
              index: idx
            }));
          } else if (media.display_url) {
            images = [{ url: media.display_url, index: 0 }];
          }
          
          caption = media.edge_media_to_caption?.edges?.[0]?.node?.text || caption;
          username = media.owner?.username || username;
          likes = media.edge_media_preview_like?.count || 0;
          comments = media.edge_media_to_comment?.count || 0;
          views = media.video_view_count || 0;
        } catch (e) {
          console.log('Script parse error:', e.message);
        }
      }

      // Se não encontrou imagem via embed, tentar API alternativa
      if (images.length === 0) {
        console.log('No image found in embed, trying graphql...');
        
        // Tentar endpoint graphql público
        const graphqlUrl = `https://www.instagram.com/graphql/query/?query_hash=b3055c01b4b222b8a47dc12b090e4e64&variables=${encodeURIComponent(JSON.stringify({shortcode}))}`;
        
        try {
          const gqlResponse = await fetch(graphqlUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
            }
          });
          
          if (gqlResponse.ok) {
            const gqlData = await gqlResponse.json();
            const media = gqlData.data?.shortcode_media;
            
            if (media) {
              if (media.edge_sidecar_to_children?.edges) {
                images = media.edge_sidecar_to_children.edges.map((edge, idx) => ({
                  url: edge.node.display_url,
                  index: idx
                }));
              } else if (media.display_url) {
                images = [{ url: media.display_url, index: 0 }];
              }
              
              caption = media.edge_media_to_caption?.edges?.[0]?.node?.text || caption;
              username = media.owner?.username || username;
              likes = media.edge_media_preview_like?.count || likes;
              comments = media.edge_media_to_comment?.count || comments;
              views = media.video_view_count || views;
            }
          }
        } catch (gqlError) {
          console.log('GraphQL fallback error:', gqlError.message);
        }
      }

      if (images.length === 0 && !caption) {
        console.log('Could not extract data from embed');
        return Response.json({ error: 'Não foi possível extrair dados do post. Tente outra URL.' });
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