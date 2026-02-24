/**
 * Utilitários de sanitização para Multi Chat
 * Garante segurança e validação de inputs
 */

/**
 * Sanitiza input do usuário
 * Remove caracteres perigosos e normaliza espaços
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove caracteres de controle (exceto newlines e tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normaliza múltiplos espaços em um só
    .replace(/[ \t]+/g, ' ')
    // Normaliza múltiplas quebras de linha em no máximo 2
    .replace(/\n{3,}/g, '\n\n')
    // Remove espaços no início e fim
    .trim();
}

/**
 * Valida se o input é válido para envio
 */
export function isValidInput(input) {
  const sanitized = sanitizeInput(input);
  return sanitized.length > 0 && sanitized.length <= 100000; // Max 100k chars
}

/**
 * Sanitiza título de conversa
 */
export function sanitizeTitle(title) {
  if (!title || typeof title !== 'string') {
    return '';
  }

  return title
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
    .replace(/[<>]/g, '') // Remove < e > para prevenir HTML injection
    .trim()
    .slice(0, 200); // Max 200 chars
}

/**
 * Sanitiza system prompt
 */
export function sanitizeSystemPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return '';
  }

  return prompt
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 10000); // Max 10k chars
}

/**
 * Valida resposta da API OpenRouter
 */
export function validateOpenRouterResponse(data) {
  if (!data) {
    throw new Error('Resposta vazia da API');
  }

  if (data.error) {
    throw new Error(data.error.message || 'Erro na API OpenRouter');
  }

  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error('Resposta inválida: sem choices');
  }

  const content = data.choices[0]?.message?.content;
  
  if (typeof content !== 'string') {
    throw new Error('Resposta inválida: conteúdo não é string');
  }

  return {
    content,
    usage: data.usage || {},
    model: data.model,
    id: data.id,
  };
}