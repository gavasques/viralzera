/**
 * Extrator especializado para dados de persona do chat
 * Detecta múltiplos formatos de JSON de persona
 */

/**
 * Extrai JSON de um conteúdo de texto
 */
function extractJsonFromText(content) {
  if (!content) return null;
  
  // Tenta encontrar blocos de código JSON
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (e) {
      // Continua procurando
    }
  }
  
  // Tenta encontrar JSON direto
  const jsonPatterns = [
    /\{[\s\S]*"persona"[\s\S]*:[\s\S]*\{[\s\S]*\}[\s\S]*\}/g,
    /\{[\s\S]*"nome"[\s\S]*:[\s\S]*"[\s\S]*"[\s\S]*\}/g
  ];
  
  for (const pattern of jsonPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      for (const jsonStr of matches) {
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
        } catch (e) {
          // Continua tentando
        }
      }
    }
  }
  
  return null;
}

/**
 * Verifica se um JSON contém dados de persona
 */
function isPersonaData(json) {
  if (!json) return false;
  
  // Formato com wrapper "persona"
  if (json.persona) return true;
  
  // Formato direto com campos conhecidos
  const personaFields = [
    'nome', 'quem_sou_eu', 'hobbies_e_interesses', 'minha_historia_completa',
    'o_que_odeio_anti_heroi', 'habilidades_o_que_sei_fazer', 'pensamentos_e_frases_marcantes',
    'tom_de_voz', 'minhas_crencas', 'objetivos', 'valores', 'identidade',
    // Campos em inglês
    'who_am_i', 'tone_of_voice', 'beliefs', 'hatred_list'
  ];
  
  const matchingFields = personaFields.filter(field => json[field] !== undefined);
  return matchingFields.length >= 3;
}

/**
 * Extrai e normaliza dados de persona do conteúdo do chat
 * Retorna { raw, normalized } onde raw é o JSON original e normalized é para a entidade
 */
export function extractPersonaFromContent(content) {
  const json = extractJsonFromText(content);
  if (!json || !isPersonaData(json)) return null;
  
  // Extrai o objeto persona (pode ter wrapper ou não)
  const raw = json.persona || json;
  
  // perfil_final_formatado pode estar no nível raiz ou dentro de persona
  const perfilFormatado = json.perfil_final_formatado || raw.perfil_final_formatado;
  
  // Normaliza para o schema da entidade Persona
  const normalized = normalizePersonaToEntity(raw, perfilFormatado);
  
  return { raw, normalized };
}

/**
 * Normaliza dados de persona para o schema da entidade
 */
function normalizePersonaToEntity(raw, perfilFormatado) {
  // Normaliza objetivos - pode vir como objeto com chaves diferentes
  const objectives = raw.objetivos || raw.objectives || {};
  const normalizedObjectives = {
    em_12_meses: objectives.em_12_meses || objectives['12_meses'] || objectives.curto_prazo || '',
    em_3_anos: objectives.em_3_anos || objectives['3_anos'] || objectives.medio_prazo || '',
    em_10_anos: objectives.em_10_anos || objectives['10_anos'] || objectives.longo_prazo || ''
  };

  // Normaliza valores - pode vir como objeto com chaves diferentes
  const values = raw.valores || raw.values || {};
  const normalizedValues = {
    nao_negociaveis: values.nao_negociaveis || values.inegociaveis || [],
    nao_tolero: values.nao_tolero || values.intoleravel || []
  };

  return {
    name: raw.nome || raw.name || 'Nova Persona',
    
    who_am_i: raw.quem_sou_eu || raw.who_am_i || '',
    
    hobbies: raw.hobbies_e_interesses || raw.hobbies || raw.interesses || [],
    
    story: raw.minha_historia_completa || raw.story || raw.historia || {},
    
    hatred_list: normalizeHatredList(raw.o_que_odeio_anti_heroi || raw.hatred_list || raw.lista_odio),
    
    skills: raw.habilidades_o_que_sei_fazer || raw.skills || raw.habilidades || {},
    
    thoughts_phrases: raw.pensamentos_e_frases_marcantes || raw.thoughts_phrases || raw.pensamentos_frases || {},
    
    tone_of_voice: raw.tom_de_voz || raw.tone_of_voice || {},
    
    beliefs: raw.minhas_crencas || raw.beliefs || raw.crencas || {},
    
    values: normalizedValues,
    
    objectives: normalizedObjectives,
    
    identity: raw.identidade || raw.identity || [],
    
    example_texts: perfilFormatado || raw.example_texts || raw.exemplos_textos || ''
  };
}

/**
 * Normaliza lista de "ódio" para formato padrão
 * Mantém a estrutura original do JSON para não perder informações
 */
function normalizeHatredList(list) {
  if (!list) return [];
  if (!Array.isArray(list)) return [];
  
  return list.map(item => {
    if (typeof item === 'string') {
      return { alvo: item };
    }
    // Mantém o objeto original com suas propriedades
    return {
      alvo: item.alvo || item.item || '',
      por_que_me_irrita: item.por_que_me_irrita || item.reason || '',
      exemplo_real: item.exemplo_real || item.example || ''
    };
  });
}

/**
 * Verifica se o conteúdo contém uma persona válida
 */
export function hasPersonaData(content) {
  const json = extractJsonFromText(content);
  return isPersonaData(json);
}