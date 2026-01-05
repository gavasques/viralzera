import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Recriada integração com RapidAPI (instagram-scraper-20251)
// Aceita: { shortcode?: string, code_or_url?: string, url?: string }
// Retorna: objeto padronizado com imagens, metrículas e metadados
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { shortcode, code_or_url, url } = body || {};

    // Derivar code_or_url
    let codeOrUrl = code_or_url || shortcode || url || '';
    if (!codeOrUrl && body?.instagram_url) codeOrUrl = body.instagram_url;

    // Se veio URL completa do Instagram, extrair o shortcode
    if (codeOrUrl && codeOrUrl.includes('instagram.com')) {
      const m = codeOrUrl.match(/(?:\/p\/|\/reel\/|\/reels\/|\/tv\/)([A-Za-z0-9_-]+)/);
      if (m && m[1]) {
        codeOrUrl = m[1];
      }
    }

    if (!codeOrUrl || typeof codeOrUrl !== 'string') {
      return Response.json({ error: 'Parâmetro ausente: forneça shortcode ou URL' }, { status: 400 });
    }

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      return Response.json({ error: 'RAPIDAPI_KEY não configurada' }, { status: 500 });
    }

    const endpoint = `https://instagram-scraper-20251.p.rapidapi.com/postdetail/?code_or_url=${encodeURIComponent(codeOrUrl)}&url_embed_safe=true`;

    const raRes = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-scraper-20251.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
    });

    if (!raRes.ok) {
      const text = await raRes.text().catch(() => '');
      console.error('RapidAPI error:', raRes.status, text);
      return Response.json({ error: `Erro na API: ${raRes.status}` }, { status: raRes.status });
    }

    const result = await raRes.json();
    const data = result?.data?.items?.[0];
    if (!data) {
      return Response.json({ error: 'Post não encontrado' }, { status: 404 });
    }

    // Montar lista de imagens (carrossel ou única)
    let images = [];
    try {
      if (Array.isArray(data.carousel_media) && data.carousel_media.length > 0) {
        images = data.carousel_media.map((item, index) => {
          const candidate = item?.image_versions2?.candidates?.[0] || item?.image_versions?.items?.[0] || null;
          return {
            url: candidate?.url || null,
            width: candidate?.width || item?.original_width || null,
            height: candidate?.height || item?.original_height || null,
            index,
            cloudinary_url: null, // opcional (podemos popular futuramente)
          };
        }).filter((x) => !!x.url);
      } else if (data?.image_versions2?.candidates?.[0]) {
        const c = data.image_versions2.candidates[0];
        images = [{ url: c.url, width: c.width, height: c.height, index: 0, cloudinary_url: null }];
      }
    } catch (_) {
      // mantém images = []
    }

    const videoVersions = Array.isArray(data.video_versions) ? data.video_versions : [];

    // Objeto padronizado
    const parsed = {
      id: data.id || data.pk || null,
      shortcode: data.code || codeOrUrl,
      caption: data.caption?.text || '',
      title: data.title || '',
      likes: data.like_count || 0,
      comments: data.comment_count || 0,
      views: data.play_count || data.ig_play_count || data.view_count || 0,
      shares: data.reshare_count || 0,
      username: data.user?.username || data.owner?.username || '',
      user_full_name: data.user?.full_name || data.owner?.full_name || '',
      images,
      raw: {
        ...data,
        video_versions: videoVersions,
        metrics: {
          like_count: data.like_count,
          comment_count: data.comment_count,
          play_count: data.play_count || data.ig_play_count,
          share_count: data.reshare_count,
        },
      },
    };

    return Response.json(parsed);
  } catch (error) {
    console.error('instagramFetch error:', error);
    return Response.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
});