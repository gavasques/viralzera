/**
 * Serviço para buscar modelos diretamente da API OpenRouter
 * Usado nas páginas admin para listar modelos disponíveis
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/models';

/**
 * Busca a lista de modelos disponíveis no OpenRouter
 * @returns {Promise<Array>} Lista de modelos
 */
export async function fetchOpenRouterModels() {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('[OpenRouterAPIService] Error fetching models:', error);
    throw error;
  }
}