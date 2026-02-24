import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

// Recriada integração com RapidAPI (instagram-scraper-20251)
// Aceita: { shortcode?: string, code_or_url?: string, url?: string }
// Retorna: objeto padronizado com imagens, metrículas e metadados
Deno.serve(async (req) => {
  try {
    const neon = createClientFromRequest(req);
    const user = await neon.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { shortcode, code_or_url, url } = body || {};

    // Derivar code_or_url (preserva entrada original)
    const originalInput = code_or_url || url || body?.instagram_url || shortcode || '';
    let codeOrUrl = originalInput;

    // Se vier URL completa do Instagram, manter a URL; a API aceita URL ou shortcode
    // Não converter para shortcode para aumentar a taxa de sucesso

    if (!codeOrUrl || typeof codeOrUrl !== 'string') {
      return Response.json({ error: 'Parâmetro ausente: forneça shortcode ou URL' }, { status: 400 });
    }

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      return Response.json({ error: 'RAPIDAPI_KEY não configurada' }, { status: 500 });
    }

    async function fetchPost(codeOrUrlParam) {
      const endpoint = `https://instagram-scraper-20251.p.rapidapi.com/postdetail/?code_or_url=${encodeURIComponent(codeOrUrlParam)}&url_embed_safe=true`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Host': 'instagram-scraper-20251.p.rapidapi.com',
          'X-RapidAPI-Key': rapidApiKey,
        },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('RapidAPI error:', res.status, text);
        return null;
      }
      const json = await res.json().catch(() => null);
      if (!json) return null;
      // Extrair em diferentes formatos possíveis da API
      const extract = (j) => {
        if (!j) return null;
        if (j.data) {
          if (Array.isArray(j.data.items) && j.data.items.length) return j.data.items[0];
          if (j.data.item) return j.data.item;
          return j.data;
        }
        if (Array.isArray(j.items) && j.items.length) return j.items[0];
        if (j.item) return j.item;
        if (j.caption || j.user || j.image_versions2 || j.carousel_media) return j;
        return null;
      };
      return extract(json);
    }

    let data = await fetchPost(codeOrUrl);

    // Fallback: tentar com shortcode extraído
    if (!data) {
      const m2 = originalInput?.match(/(?:\/p\/|\/reel\/|\/reels\/|\/tv\/)([A-Za-z0-9_-]+)/);
      const short = m2?.[1];
      if (short && short !== codeOrUrl) {
        data = await fetchPost(short);
      }
    }

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