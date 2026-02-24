import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

const WEBHOOK_URL = 'https://webhook.guivasques.app/webhook/9c5caeb2-5742-4575-af82-a4cca3a8d6ed';

Deno.serve(async (req) => {
  try {
    const neon = createClientFromRequest(req);
    const user = await neon.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url) {
      return Response.json({ error: 'URL não fornecida' }, { status: 400 });
    }

    console.log('[instagramWebhook] Chamando webhook com URL:', url);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    console.log('[instagramWebhook] Status:', response.status);

    const text = await response.text();
    console.log('[instagramWebhook] Resposta bruta:', text.substring(0, 500));

    if (!text || text.trim() === '') {
      return Response.json({ error: 'Webhook retornou resposta vazia' }, { status: 502 });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('[instagramWebhook] Erro ao parsear JSON:', e);
      return Response.json({ error: 'Resposta inválida do webhook', raw: text.substring(0, 200) }, { status: 502 });
    }

    // Retorna o primeiro item do array se for array
    const post = Array.isArray(data) ? data[0] : data;

    if (!post || !post.id) {
      return Response.json({ error: 'Post não encontrado', data }, { status: 404 });
    }

    return Response.json(post);
  } catch (error) {
    console.error('[instagramWebhook] Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});