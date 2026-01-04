import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        if (req.method !== 'POST') {
            return Response.json({ error: 'Method not allowed' }, { status: 405 });
        }

        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query } = await req.json();

        if (!query) {
            return Response.json({ error: 'Query is required' }, { status: 400 });
        }

        const webhookUrl = Deno.env.get("DEEP_RESEARCH_WEBHOOK_URL");

        if (!webhookUrl) {
            return Response.json({ error: 'Webhook URL not configured (DEEP_RESEARCH_WEBHOOK_URL)' }, { status: 500 });
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, user_email: user.email })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Webhook error: ${response.status} - ${text}`);
        }

        // Try to parse JSON if possible, otherwise return text
        const responseText = await response.text();
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch {
            responseData = { message: responseText };
        }

        return Response.json({ success: true, data: responseData });

    } catch (error) {
        console.error('Deep Research Webhook Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});