import { createClientFromRequest } from 'npm:@neon/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const neon = createClientFromRequest(req);
        const user = await neon.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { webhookUrl, payload } = body;

        if (!webhookUrl) {
            return Response.json({ error: 'webhookUrl é obrigatório' }, { status: 400 });
        }

        // Forward request to the webhook
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || {})
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            return Response.json({ 
                error: `Webhook error: ${response.status}`, 
                details: errorText 
            }, { status: response.status });
        }

        const responseText = await response.text();
        
        // Try to parse as JSON
        try {
            const jsonData = JSON.parse(responseText);
            return Response.json({ data: jsonData });
        } catch {
            return Response.json({ data: responseText });
        }

    } catch (error) {
        console.error('refinerWebhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});