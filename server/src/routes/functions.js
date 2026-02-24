import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../db/index.js';
import axios from 'axios';

const router = Router();
router.use(authenticate);

function getOpenRouterKey(userConfig) {
  return process.env.OPENROUTER_API_KEY || userConfig?.openrouter_api_key;
}

router.post('/analyzeText', async (req, res) => {
  try {
    const { textId, modeling_id } = req.body;
    const userId = req.user.id;

    const text = await prisma.modelingText.findUnique({ where: { id: textId } });
    if (!text || !text.content) {
      return res.status(404).json({ error: 'Texto não encontrado' });
    }

    const config = await prisma.modelingTextAnalyzerConfig.findFirst();
    if (!config?.model) {
      return res.status(400).json({ error: 'Configure o agente de Análise de Textos' });
    }

    const userConfig = await prisma.userConfig.findFirst({
      where: { user_id: userId }
    });
    const apiKey = getOpenRouterKey(userConfig);

    if (!apiKey) {
      return res.status(400).json({ error: 'Configure sua API Key do OpenRouter' });
    }

    const systemPrompt = config.prompt.replace(/\{\{text_content\}\}/g, text.content);

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Por favor, analise este texto:\n\n${text.content}` }
      ],
      temperature: 0.7,
      max_tokens: config.max_tokens || 4000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Viralzera - Text Analyzer'
      }
    });

    const analysis = response.data.choices?.[0]?.message?.content;

    const analysisRecord = await prisma.modelingAnalysis.create({
      data: {
        modeling_id,
        material_id: textId,
        material_type: 'text',
        material_title: text.title,
        analysis_summary: analysis,
        character_count: analysis.length,
        token_estimate: Math.ceil(analysis.length / 4),
        status: 'completed',
        created_by: req.user.email
      }
    });

    res.json({ success: true, analysisId: analysisRecord.id, analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/openrouter', async (req, res) => {
  try {
    const { model, messages, temperature = 0.7, max_tokens = 4000, plugins, reasoning } = req.body;

    const userConfig = await prisma.userConfig.findFirst({
      where: { user_id: req.user.id }
    });
    const apiKey = getOpenRouterKey(userConfig);

    if (!apiKey) {
      return res.status(400).json({ error: 'Configure sua API Key do OpenRouter' });
    }

    const body = { model, messages, temperature, max_tokens };
    if (plugins) body.plugins = plugins;
    if (reasoning) body.reasoning = reasoning;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', body, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Viralzera'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

router.post('/titanosChat', async (req, res) => {
  try {
    const { conversationId, message, model = 'openai/gpt-4o-mini' } = req.body;

    const userConfig = await prisma.userConfig.findFirst({
      where: { user_id: req.user.id }
    });
    const apiKey = getOpenRouterKey(userConfig);

    if (!apiKey) {
      return res.status(400).json({ error: 'Configure sua API Key do OpenRouter' });
    }

    let conversation = null;
    let messages = [];

    if (conversationId) {
      conversation = await prisma.titanosConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { created_at: 'asc' } } }
      });
      messages = conversation.messages.map(m => ({ role: m.role, content: m.content }));
    } else {
      conversation = await prisma.titanosConversation.create({
        data: { user_id: req.user.id, title: message.substring(0, 50) }
      });
    }

    messages.push({ role: 'user', content: message });

    await prisma.titanosMessage.create({
      data: { conversation_id: conversation.id, role: 'user', content: message }
    });

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Viralzera - Titanos Chat'
      }
    });

    const assistantMessage = response.data.choices?.[0]?.message?.content;

    await prisma.titanosMessage.create({
      data: { conversation_id: conversation.id, role: 'assistant', content: assistantMessage }
    });

    res.json({ 
      conversationId: conversation.id, 
      response: assistantMessage 
    });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

router.post('/youtubeScriptGenerator', async (req, res) => {
  try {
    const { topic, style, duration, additionalInstructions } = req.body;

    const userConfig = await prisma.userConfig.findFirst({
      where: { user_id: req.user.id }
    });
    const apiKey = getOpenRouterKey(userConfig);

    if (!apiKey) {
      return res.status(400).json({ error: 'Configure sua API Key do OpenRouter' });
    }

    const prompt = `Crie um roteiro de vídeo para YouTube sobre: ${topic}
Estilo: ${style || 'educativo'}
Duração: ${duration || '5-10 minutos'}
Instruções adicionais: ${additionalInstructions || 'Nenhuma'}

Inclua: introdução, desenvolvimento, conclusão e call-to-action.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Viralzera - YouTube Script'
      }
    });

    const script = response.data.choices?.[0]?.message?.content;
    res.json({ script });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

router.post('/generateDossier', async (req, res) => {
  try {
    const { subject, type, depth = 'comprehensive' } = req.body;

    const userConfig = await prisma.userConfig.findFirst({
      where: { user_id: req.user.id }
    });
    const apiKey = getOpenRouterKey(userConfig);

    if (!apiKey) {
      return res.status(400).json({ error: 'Configure sua API Key do OpenRouter' });
    }

    const prompt = `Gere um dossier detalhado sobre: ${subject}
Tipo: ${type || 'perfil'}
Profundidade: ${depth}

Inclua: informações relevantes, análise de contexto, pontos-chave e recomendações.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Viralzera - Dossier'
      }
    });

    const dossier = response.data.choices?.[0]?.message?.content;
    res.json({ dossier });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

export default router;
