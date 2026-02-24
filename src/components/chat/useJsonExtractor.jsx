/**
 * Hook para detectar e extrair JSON de mensagens de chat
 */

/**
 * Tenta extrair JSON de uma string de texto
 * Procura por blocos de código JSON ou objetos JSON diretos
 */
export function extractJsonFromContent(content) {
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
  
  // Tenta encontrar JSON direto (objeto ou array)
  const jsonPatterns = [
    /\{[\s\S]*"[\w_]+"[\s\S]*:[\s\S]*\}/g,
    /\[[\s\S]*\{[\s\S]*\}[\s\S]*\]/g
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
 * Detecta o tipo de dados baseado na estrutura do JSON
 */
export function detectJsonType(json) {
  if (!json) return null;
  
  // Detecta Público-Alvo
  if (json.publico_unico || json.niveis || json.descricao_base) {
    return 'audience';
  }
  
  // Array de públicos
  if (Array.isArray(json) && json[0]?.nome && (json[0]?.tipo || json[0]?.dores || json[0]?.descricao)) {
    return 'audience_list';
  }
  
  // Detecta Persona - agora tratado pelo PersonaPreviewCard separadamente
  // Mantido aqui para compatibilidade com SaveFromChatButton
  if (json.who_am_i || json.quem_sou_eu || json.tone_of_voice || json.tom_de_voz || json.beliefs || json.crencas) {
    // Novo formato com wrapper "persona" é tratado pelo PersonaPreviewCard
    if (json.persona || json.perfil_final_formatado || json.hobbies_e_interesses) {
      return null; // Deixa o PersonaPreviewCard tratar
    }
    return 'persona';
  }
  
  // Detecta Produto (formato novo com wrapper "produto" ou formato direto)
  if (json.produto || json.benefits || json.beneficios || json.problem_solved || json.problema_resolvido || json.problema_que_resolve) {
    return 'product';
  }
  
  return null;
}

/**
 * Normaliza dados de público-alvo para o schema da entidade
 */
export function normalizeAudienceData(json, focusId) {
  const audiences = [];
  
  // Se tem estrutura "publico_unico" com "niveis"
  if (json.publico_unico?.niveis) {
    const funnelMap = {
      'TOPO': 'Topo de Funil',
      'MEIO': 'Meio de Funil',
      'FUNDO': 'Fundo de Funil'
    };
    
    json.publico_unico.niveis.forEach(nivel => {
      audiences.push({
        focus_id: focusId,
        name: nivel.nome || `Público ${nivel.tipo}`,
        funnel_stage: funnelMap[nivel.tipo] || 'Topo de Funil',
        description: nivel.descricao || '',
        pains: Array.isArray(nivel.dores) ? nivel.dores.join('\n') : (nivel.dores || ''),
        ambitions: Array.isArray(nivel.desejos || nivel.ambicoes) 
          ? (nivel.desejos || nivel.ambicoes).join('\n') 
          : (nivel.desejos || nivel.ambicoes || ''),
        habits: Array.isArray(nivel.habitos) ? nivel.habitos.join('\n') : (nivel.habitos || ''),
        common_enemy: nivel.inimigo_comum || ''
      });
    });
  }
  
  // Se é um array direto de públicos
  if (Array.isArray(json)) {
    const funnelMap = {
      'TOPO': 'Topo de Funil',
      'MEIO': 'Meio de Funil',
      'FUNDO': 'Fundo de Funil',
      'topo': 'Topo de Funil',
      'meio': 'Meio de Funil',
      'fundo': 'Fundo de Funil'
    };
    
    json.forEach(item => {
      audiences.push({
        focus_id: focusId,
        name: item.nome || item.name || 'Público',
        funnel_stage: funnelMap[item.tipo] || funnelMap[item.funnel_stage] || 'Topo de Funil',
        description: item.descricao || item.description || '',
        pains: Array.isArray(item.dores || item.pains) 
          ? (item.dores || item.pains).join('\n') 
          : (item.dores || item.pains || ''),
        ambitions: Array.isArray(item.desejos || item.ambitions || item.ambicoes) 
          ? (item.desejos || item.ambitions || item.ambicoes).join('\n') 
          : (item.desejos || item.ambitions || item.ambicoes || ''),
        habits: Array.isArray(item.habitos || item.habits) 
          ? (item.habitos || item.habits).join('\n') 
          : (item.habitos || item.habits || ''),
        common_enemy: item.inimigo_comum || item.common_enemy || ''
      });
    });
  }
  
  return audiences;
}

/**
 * Normaliza dados de persona para o schema da entidade
 */
export function normalizePersonaData(json, focusId) {
  // Se o JSON tem wrapper "persona", extrai o objeto interno
  const personaData = json.persona || json;
  
  // Extrai nome da persona de vários formatos possíveis
  const name = personaData.name || 
               personaData.nome || 
               personaData.nome_persona || 
               'Nova Persona';
  
  // Extrai quem sou eu
  const whoAmI = personaData.who_am_i || 
                 personaData.quem_sou_eu ||
                 personaData.resumo_em_uma_frase ||
                 '';
  
  // Extrai habilidades (formato antigo ou novo "arsenal_de_habilidades")
  const skills = personaData.skills || 
                 personaData.habilidades || 
                 personaData.arsenal_de_habilidades || 
                 {};
  
  // Extrai hobbies de vários lugares
  const hobbies = personaData.hobbies || 
                  personaData.interesses || 
                  [];
  
  // Extrai crenças (formato antigo ou novo com "filosofia_de_vida_crencas")
  const beliefs = personaData.beliefs || 
                  personaData.crencas || 
                  personaData.filosofia_de_vida_crencas || 
                  {};
  
  // Extrai tom de voz (formato antigo ou novo "voz_e_comunicacao")
  const toneOfVoice = personaData.tone_of_voice || 
                      personaData.tom_de_voz || 
                      personaData.voz_e_comunicacao || 
                      {};
  
  // Extrai pensamentos e frases
  const thoughtsPhrases = personaData.thoughts_phrases || 
                          personaData.pensamentos_frases || 
                          {};
  
  // Extrai lista de ódio (formato antigo ou novo "missao_e_anti_herois")
  const hatredList = personaData.hatred_list || 
                     personaData.lista_odio ||
                     (personaData.missao_e_anti_herois?.contra_o_que_eu_luto || []).map(item => ({ item })) ||
                     [];
  
  // Extrai história (formato antigo ou novo "jornada_do_heroi")
  const story = personaData.story || 
                personaData.historia || 
                personaData.jornada_do_heroi || 
                {};
  
  // Extrai valores (formato antigo ou novo "codigo_de_valores")
  const values = personaData.values || 
                 personaData.valores || 
                 personaData.codigo_de_valores || 
                 {};
  
  // Extrai objetivos
  const objectives = personaData.objectives || 
                     personaData.objetivos ||
                     (personaData.missao_e_anti_herois ? { missao: personaData.missao_e_anti_herois.o_que_eu_busco } : {});
  
  // Extrai perfil formatado como example_texts se existir
  const exampleTexts = personaData.example_texts || 
                       personaData.exemplos_textos ||
                       json.perfil_final_formatado ||
                       '';
  
  return {
    focus_id: focusId,
    name: name,
    who_am_i: whoAmI,
    skills: skills,
    hobbies: hobbies,
    beliefs: beliefs,
    tone_of_voice: toneOfVoice,
    thoughts_phrases: thoughtsPhrases,
    example_texts: exampleTexts,
    hatred_list: hatredList,
    story: story,
    values: values,
    objectives: objectives,
    identity: personaData.identity || personaData.identidade || []
  };
}

/**
 * Normaliza dados de produto para o schema da entidade
 */
export function normalizeProductData(json, focusId) {
  // Se o JSON tem wrapper "produto", extrai o objeto interno
  const productData = json.produto || json;
  
  const typeMap = {
    'curso': 'Curso',
    'mentoria': 'Mentoria',
    'aulas': 'Aulas',
    'consulta': 'Consulta',
    'sessao': 'Sessão',
    'sessão': 'Sessão',
    'produto': 'Produto',
    'arquivos': 'Arquivos',
    'evento': 'Evento',
    'outro': 'Outro'
  };
  
  const priceTypeMap = {
    'gratis': 'Grátis',
    'gratuito': 'Grátis',
    'grátis': 'Grátis',
    'mensal': 'Mensal',
    'unico': 'Pagamento Único',
    'único': 'Pagamento Único',
    'pagamento_unico': 'Pagamento Único',
    'pagamento único': 'Pagamento Único'
  };
  
  // Obtém o tipo do produto
  const rawType = productData.type || productData.tipo || productData.tipo_produto || '';
  const normalizedType = typeMap[rawType.toLowerCase()] || 'Outro';
  
  // Obtém o tipo de preço
  const rawPriceType = productData.price_type || productData.tipo_preco || '';
  const normalizedPriceType = priceTypeMap[rawPriceType.toLowerCase()] || 'Pagamento Único';
  
  // Obtém o nome do produto
  const name = productData.name || productData.nome || productData.nome_produto || 'Novo Produto';
  
  // Obtém benefícios
  const benefits = productData.benefits || productData.beneficios;
  const normalizedBenefits = Array.isArray(benefits) ? benefits.join('\n') : (benefits || '');
  
  // Obtém problema resolvido
  const problemSolved = productData.problem_solved || productData.problema_resolvido || productData.problema_que_resolve || '';
  
  return {
    focus_id: focusId,
    type: normalizedType,
    name: name,
    description: productData.description || productData.descricao || '',
    benefits: normalizedBenefits,
    problem_solved: problemSolved,
    price_type: normalizedPriceType,
    price: productData.price || productData.preco || productData.valor || 0,
    is_active: true
  };
}