/**
 * Serviço para pesquisa de tendências via OpenRouter
 */

import { callFunction } from '@/api/neonClient';

/**
 * Pesquisa tendências via OpenRouter com Web Search habilitado
 */
export async function searchTrends({ model, prompt, maxTokens }) {
  if (!model) {
    throw new Error('Modelo de busca não configurado');
  }

  const data = await callFunction('openrouter', {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: maxTokens || 32000,
    plugins: [{ id: 'web' }],
  });

  const message = data.choices?.[0]?.message;

  if (!message?.content) {
    throw new Error('Nenhum resultado retornado. Tente outro modelo ou refine sua busca.');
  }

  return {
    content: message.content,
    annotations: message.annotations || [],
    usage: data.usage || {},
  };
}
