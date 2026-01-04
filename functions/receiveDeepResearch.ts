import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    try {
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        const base44 = createClientFromRequest(req);
        
        const payload = await req.json();
        console.log('Deep Research Webhook Payload:', JSON.stringify(payload));

        let data = payload;
        if (Array.isArray(payload)) {
            data = payload[0];
        }

        if (!data) {
             return Response.json({ error: 'Empty payload' }, { status: 400 });
        }

        const { modeling_id, output, query, search_depth, topic, time_range } = data;

        if (!modeling_id) {
             console.error('Missing modeling_id in webhook payload');
             return Response.json({ error: 'Missing modeling_id' }, { status: 400 });
        }
        
        if (!output) {
             console.error('Missing output in webhook payload');
             return Response.json({ error: 'Missing output' }, { status: 400 });
        }

        // Create the record using service role
        await base44.asServiceRole.entities.ModelingResearch.create({
            modeling_id,
            output,
            query: query || '',
            search_depth: search_depth || '',
            topic: topic || '',
            time_range: time_range || '',
            status: 'completed'
        });

        return Response.json({ success: true });

    } catch (error) {
        console.error('Error processing webhook:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});