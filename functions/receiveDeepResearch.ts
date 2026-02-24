import { createClientFromRequest } from 'npm:@neon/sdk@0.8.3';

Deno.serve(async (req) => {
    try {
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        const neon = createClientFromRequest(req);
        
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

        // Create the record using service role (as ModelingText)
        const content = output;
        const charCount = content.length;
        const tokenEstimate = Math.ceil(charCount / 4);

        const text = await neon.asServiceRole.entities.ModelingText.create({
            modeling_id,
            title: `Pesquisa: ${query || 'Deep Research'}`,
            description: `Depth: ${search_depth || 'N/A'}, Topic: ${topic || 'N/A'}, Range: ${time_range || 'all'}`,
            content: content,
            text_type: 'research',
            character_count: charCount,
            token_estimate: tokenEstimate
        });

        // Update modeling totals (optional)
        try {
            const allTexts = await neon.asServiceRole.entities.ModelingText.filter({ modeling_id });
            const allVideos = await neon.asServiceRole.entities.ModelingVideo.filter({ modeling_id });
            
            const textChars = allTexts.reduce((sum, t) => sum + (t.character_count || 0), 0);
            const textTokens = allTexts.reduce((sum, t) => sum + (t.token_estimate || 0), 0);
            const videoChars = allVideos.reduce((sum, v) => sum + (v.character_count || 0), 0);
            const videoTokens = allVideos.reduce((sum, v) => sum + (v.token_estimate || 0), 0);

            await neon.asServiceRole.entities.Modeling.update(modeling_id, {
                total_characters: textChars + videoChars,
                total_tokens_estimate: textTokens + videoTokens
            });
        } catch (e) {
            console.error("Error updating totals:", e);
        }

        // Trigger analysis
        try {
             await neon.asServiceRole.functions.invoke('runModelingAnalysis', {
                modeling_id: modeling_id,
                materialId: text.id,
                materialType: 'text',
                content: content
            });
        } catch (e) {
            console.error("Error triggering analysis:", e);
        }

        return Response.json({ success: true, id: text.id });

    } catch (error) {
        console.error('Error processing webhook:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});