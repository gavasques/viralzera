import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shortcode } = await req.json();

    if (!shortcode) {
      return Response.json({ error: 'Shortcode é obrigatório' }, { status: 400 });
    }

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      return Response.json({ error: 'RAPIDAPI_KEY não configurada' }, { status: 500 });
    }

    // Chamar RapidAPI
    const response = await fetch(
      `https://instagram-scraper-20251.p.rapidapi.com/postdetail/?code_or_url=${shortcode}&url_embed_safe=true`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'instagram-scraper-20251.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RapidAPI error:', response.status, errorText);
      return Response.json({ error: `Erro na API: ${response.status}` }, { status: response.status });
    }

    const result = await response.json();
    
    // A resposta vem em data.items[0]
    const data = result.data?.items?.[0];

    if (!data) {
      return Response.json({ error: 'Post não encontrado' }, { status: 404 });
    }

    // Processar imagens do carrossel ou imagem única
    let images = [];
    if (data.carousel_media) {
      images = data.carousel_media.map((item, idx) => ({
        url: item.image_versions2?.candidates?.[0]?.url || item.image_versions?.items?.[0]?.url,
        width: item.image_versions2?.candidates?.[0]?.width || item.original_width,
        height: item.image_versions2?.candidates?.[0]?.height || item.original_height,
        index: idx
      }));
    } else if (data.image_versions2?.candidates?.[0]) {
      images = [{
        url: data.image_versions2.candidates[0].url,
        width: data.image_versions2.candidates[0].width,
        height: data.image_versions2.candidates[0].height,
        index: 0
      }];
    }

    // Extrair video_versions se existir
    const videoVersions = data.video_versions || [];

    const postDataParsed = {
      id: data.id || data.pk,
      shortcode: data.code,
      caption: data.caption?.text || '',
      title: data.title || '',
      likes: data.like_count || 0,
      comments: data.comment_count || 0,
      views: data.play_count || data.ig_play_count || data.view_count || 0,
      shares: data.reshare_count || 0,
      username: data.user?.username || data.owner?.username || '',
      user_full_name: data.user?.full_name || data.owner?.full_name || '',
      images: images,
      raw: {
        ...data,
        video_versions: videoVersions,
        metrics: {
          like_count: data.like_count,
          comment_count: data.comment_count,
          play_count: data.play_count || data.ig_play_count,
          share_count: data.reshare_count
        }
      }
    };

    return Response.json(postDataParsed);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});