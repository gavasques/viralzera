/**
 * Configurações específicas de cada tipo de vídeo para YouTube
 */
const VIDEO_TYPE_CONFIG = {
  tutorial: {
    label: 'Tutorial Passo a Passo',
    duration: '10-30 min',
    structure: 'Vídeo que ensina um processo completo do início ao fim, dividido em etapas claras e acionáveis.',
    hookInstructions: 'Mostre o RESULTADO final que a pessoa vai conseguir. Crie urgência mostrando o que ela está perdendo por não saber isso. Use uma promessa específica e mensurável.',
    bodyInstructions: 'Divida em passos numerados e claros. Para cada passo: (1) explique O QUE fazer, (2) mostre COMO fazer, (3) explique POR QUE é importante. Use a técnica PSP entre os passos para manter engajamento.',
    ctaInstructions: 'Convide para baixar um checklist, template ou material complementar. Peça para comentar qual passo foi mais útil.'
  },
  lista: {
    label: 'Lista',
    duration: '8-20 min',
    structure: 'Vídeo no formato "X dicas/erros/ferramentas/etc" com itens numerados e organizados.',
    hookInstructions: 'Mencione o número de itens e prometa uma transformação. Diga qual item é o mais impactante para criar curiosidade. Ex: "O item 7 mudou completamente meus resultados".',
    bodyInstructions: 'Apresente cada item com: título claro, explicação do problema que resolve, exemplo prático. Varie o ritmo - alguns itens mais rápidos, outros mais profundos. Use PSP entre os itens principais.',
    ctaInstructions: 'Peça para comentar qual item foi mais surpreendente ou qual eles já usavam. Ofereça uma lista expandida como lead magnet.'
  },
  dica_rapida: {
    label: 'Dica Rápida',
    duration: '3-8 min',
    structure: 'Vídeo curto e direto ao ponto, focado em UMA técnica ou insight poderoso.',
    hookInstructions: 'Vá direto ao ponto. Prometa resolver um problema específico em poucos minutos. Crie urgência mostrando o custo de não aplicar essa dica.',
    bodyInstructions: 'Foque em UMA única ideia. Explique rapidamente o contexto, mostre a técnica e dê um exemplo prático. Seja conciso mas completo.',
    ctaInstructions: 'Peça para testar a dica e comentar os resultados. Sugira um vídeo mais completo sobre o tema.'
  },
  estudo_caso: {
    label: 'Estudo de Caso',
    duration: '15-35 min',
    structure: 'Análise profunda de um caso real (seu ou de terceiros), extraindo lições práticas.',
    hookInstructions: 'Apresente o resultado impressionante do caso. Crie intriga sobre COMO foi possível. Prometa revelar os bastidores e estratégias.',
    bodyInstructions: 'Estruture como uma história: situação inicial → desafios enfrentados → estratégias aplicadas → resultados. Para cada estratégia, explique como o espectador pode aplicar. Use PSP mostrando obstáculos superados.',
    ctaInstructions: 'Convide para enviar seus próprios casos para análise. Ofereça uma consultoria ou análise personalizada.'
  },
  comparacao: {
    label: 'Comparação',
    duration: '10-25 min',
    structure: 'Vídeo comparando 2 ou mais opções, ajudando o espectador a tomar uma decisão.',
    hookInstructions: 'Apresente o dilema comum que o espectador enfrenta. Prometa uma resposta definitiva baseada em critérios objetivos. Revele qual é o vencedor para criar curiosidade sobre o porquê.',
    bodyInstructions: 'Defina critérios claros de comparação. Para cada critério: explique sua importância, compare as opções, declare um vencedor parcial. Use PSP mostrando prós e contras. Termine com veredicto final.',
    ctaInstructions: 'Peça para comentar qual opção eles escolheriam. Ofereça um guia de decisão mais completo.'
  },
  explicacao_conceito: {
    label: 'Explicação de Conceito',
    duration: '8-18 min',
    structure: 'Vídeo que explica um conceito complexo de forma simples e aplicável.',
    hookInstructions: 'Mostre como esse conceito impacta a vida/negócio do espectador. Prometa simplificar algo que parece complicado. Use uma analogia intrigante.',
    bodyInstructions: 'Comece com uma analogia do dia a dia. Explique o conceito em camadas (básico → intermediário → avançado). Dê exemplos práticos de aplicação. Use PSP mostrando o antes/depois de entender o conceito.',
    ctaInstructions: 'Peça para comentar se o conceito ficou claro. Sugira um vídeo de aplicação prática.'
  },
  desmistificacao: {
    label: 'Desmistificação',
    duration: '10-20 min',
    structure: 'Vídeo que desafia uma crença comum ou mito, apresentando a verdade com evidências.',
    hookInstructions: 'Declare a crença comum de forma provocativa. Diga que vai provar que está errada. Crie tensão antecipando a resistência do espectador.',
    bodyInstructions: 'Apresente a crença comum e por que as pessoas acreditam nela. Mostre as evidências contrárias. Explique a verdade e por que é diferente. Use PSP confrontando objeções comuns.',
    ctaInstructions: 'Peça para comentar se eles acreditavam no mito. Convide a compartilhar com alguém que ainda acredita.'
  },
  novidade: {
    label: 'Novidade',
    duration: '8-18 min',
    structure: 'Vídeo sobre uma mudança recente, atualização ou tendência emergente.',
    hookInstructions: 'Crie urgência sobre a novidade. Mostre o impacto imediato para quem não se adaptar. Prometa explicar tudo que mudou e como se preparar.',
    bodyInstructions: 'Contextualize a mudança (o que era antes). Explique o que mudou especificamente. Analise os impactos positivos e negativos. Dê um plano de ação para se adaptar. Use PSP mostrando riscos de ignorar a mudança.',
    ctaInstructions: 'Peça para comentar como essa mudança afeta eles. Ofereça atualizações via newsletter ou comunidade.'
  },
  problema_solucao: {
    label: 'Problema e Solução',
    duration: '10-25 min',
    structure: 'Vídeo que identifica um problema específico e apresenta uma solução completa.',
    hookInstructions: 'Descreva o problema de forma vívida - faça o espectador se sentir compreendido. Amplifique a dor mostrando as consequências. Prometa uma solução definitiva.',
    bodyInstructions: 'Aprofunde no problema: causas, sintomas, consequências. Apresente a solução passo a passo. Mostre como prevenir que volte a acontecer. Use PSP intensamente - agite o problema antes de cada parte da solução.',
    ctaInstructions: 'Peça para comentar se já passaram por esse problema. Ofereça uma solução mais completa ou personalizada.'
  },
  historia_pessoal: {
    label: 'História Pessoal',
    duration: '12-30 min',
    structure: 'Vídeo contando uma história pessoal com lições valiosas para o espectador.',
    hookInstructions: 'Comece pelo momento mais dramático ou transformador da história. Crie intriga sobre como você chegou lá. Prometa lições que vão ajudar o espectador.',
    bodyInstructions: 'Estruture como jornada do herói: situação inicial → desafio/crise → transformação → nova realidade. Intercale a narrativa com as lições aprendidas. Use PSP nos momentos de tensão da história.',
    ctaInstructions: 'Peça para compartilharem suas próprias histórias nos comentários. Convide para conhecer mais da sua jornada.'
  }
};

/**
 * Formata os dados da persona para o prompt
 */
function formatPersonaData(persona) {
  if (!persona) return null;
  
  let text = `- Nome: ${persona.name}\n`;
  
  if (persona.who_am_i) {
    text += `- Quem Sou Eu: ${persona.who_am_i}\n`;
  }
  
  if (persona.story && typeof persona.story === 'object') {
    const storyText = Object.entries(persona.story)
      .map(([key, value]) => `  • ${key}: ${value}`)
      .join('\n');
    if (storyText) text += `- Minha História:\n${storyText}\n`;
  }
  
  if (persona.tone_of_voice) {
    const toneText = typeof persona.tone_of_voice === 'object'
      ? JSON.stringify(persona.tone_of_voice, null, 2)
      : persona.tone_of_voice;
    text += `- Tom de Voz: ${toneText}\n`;
  }
  
  if (persona.thoughts_phrases) {
    const phrasesText = typeof persona.thoughts_phrases === 'object'
      ? JSON.stringify(persona.thoughts_phrases, null, 2)
      : persona.thoughts_phrases;
    text += `- Frases e Bordões: ${phrasesText}\n`;
  }
  
  if (persona.hobbies?.length > 0) {
    const hobbiesText = Array.isArray(persona.hobbies) ? persona.hobbies.join(', ') : persona.hobbies;
    text += `- Hobbies e Interesses: ${hobbiesText}\n`;
  }
  
  if (persona.beliefs && typeof persona.beliefs === 'object') {
    text += `- Crenças: ${JSON.stringify(persona.beliefs, null, 2)}\n`;
  }
  
  if (persona.hatred_list?.length > 0) {
    const hatredText = persona.hatred_list.map(h => typeof h === 'object' ? h.item || JSON.stringify(h) : h).join(', ');
    text += `- O que Odeia: ${hatredText}\n`;
  }
  
  return text;
}

/**
 * Formata os dados do público-alvo para o prompt
 */
function formatAudienceData(audience) {
  if (!audience) return null;
  
  let text = `- Nome: ${audience.name}\n`;
  
  if (audience.funnel_stage) {
    text += `- Etapa do Funil: ${audience.funnel_stage}\n`;
  }
  
  if (audience.description) {
    text += `- Descrição: ${audience.description}\n`;
  }
  
  if (audience.pains) {
    text += `- Dores: ${audience.pains}\n`;
  }
  
  if (audience.ambitions) {
    text += `- Ambições: ${audience.ambitions}\n`;
  }
  
  if (audience.habits) {
    text += `- Hábitos: ${audience.habits}\n`;
  }
  
  if (audience.common_enemy) {
    text += `- Inimigo Comum: ${audience.common_enemy}\n`;
  }
  
  return text;
}

/**
 * Formata os materiais selecionados para o prompt
 */
function formatMaterialsData(materials) {
  if (!materials || materials.length === 0) return null;
  
  return materials.map((mat, i) => 
    `--- ${mat.title} ---\n${mat.content}`
  ).join('\n\n');
}

/**
 * Formata os dados das modelagens para o prompt
 */
function formatModelingsData(modelingsContent) {
  if (!modelingsContent || modelingsContent.length === 0) return null;
  
  return modelingsContent.map((item, i) => {
    let text = `\n--- Modelagem ${i + 1}: ${item.title} ---\n`;
    
    if (item.creatorIdea) {
      text += `📝 Insights do Criador:\n${item.creatorIdea}\n\n`;
    }
    
    if (item.transcripts && item.transcripts.length > 0) {
      text += `🎬 Transcrições de Vídeos:\n`;
      item.transcripts.forEach((t, j) => {
        text += `[Vídeo ${j + 1}: ${t.title}]\n${t.content}\n\n`;
      });
    }
    
    if (item.texts && item.texts.length > 0) {
      text += `📄 Textos de Referência:\n`;
      item.texts.forEach((t, j) => {
        text += `[Texto ${j + 1}: ${t.title}]\n${t.content}\n\n`;
      });
    }
    
    return text;
  }).join('\n');
}

/**
 * Constrói o prompt completo para geração de roteiro YouTube
 */
export function buildYoutubePrompt({ videoType, title, persona, audience, materials, userNotes, modelingsContent }) {
  const typeConfig = VIDEO_TYPE_CONFIG[videoType];
  
  if (!typeConfig) {
    console.error(`Tipo de vídeo não encontrado: ${videoType}`);
    return '';
  }
  
  let prompt = `Olá! Preciso que você me ajude a criar um roteiro magnético para YouTube.

📹 **TIPO DE VÍDEO:** ${typeConfig.label}
**Duração esperada:** ${typeConfig.duration}
**Estrutura específica deste tipo:** ${typeConfig.structure}

📝 **TÍTULO DO VÍDEO:** ${title}
`;

  // Persona
  const personaText = formatPersonaData(persona);
  if (personaText) {
    prompt += `
👤 **MINHA PERSONA:**
${personaText}`;
  }

  // Público-alvo
  const audienceText = formatAudienceData(audience);
  if (audienceText) {
    prompt += `
🎯 **PÚBLICO-ALVO:**
${audienceText}`;
  }

  // Materiais
  const materialsText = formatMaterialsData(materials);
  if (materialsText) {
    prompt += `
📋 **MATERIAIS DE REFERÊNCIA:**
Use estas referências para criar o conteúdo:

${materialsText}
`;
  }

  // Modelagens de Referência
  const modelingsText = formatModelingsData(modelingsContent);
  if (modelingsText) {
    prompt += `
🎯 **MODELAGENS DE REFERÊNCIA:**
Analise os padrões de sucesso destas referências e use como inspiração para criar um roteiro ainda melhor.
Identifique: estrutura, ganchos, transições, técnicas de engajamento, tom de voz, e aplique no novo roteiro.

${modelingsText}
`;
  }

  // Notas extras
  if (userNotes && userNotes.trim()) {
    prompt += `
📝 **NOTAS EXTRAS DO CRIADOR:**
"${userNotes}"
`;
  }

  // Instruções de estrutura
  prompt += `
---

Com base nessas informações, crie um roteiro completo seguindo esta estrutura:

## HOOK (0-30 segundos)
${typeConfig.hookInstructions}

Escreva o texto completo do hook, palavra por palavra, pronto para ser lido/gravado.

## APRESENTAÇÃO (30s - 1min)
Apresente brevemente quem você é e por que o espectador deve ouvir você sobre este assunto. Use o tom de voz da persona. Seja breve mas crie autoridade.

Escreva o texto completo da apresentação.

## PONTE (1-2min)
Faça a transição do hook para o conteúdo principal. Explique o que será abordado e por que é importante. Crie expectativa.

Escreva o texto completo da ponte.

## CORPO (Conteúdo Principal)
${typeConfig.bodyInstructions}

**IMPORTANTE:** Aplique a técnica PSP (Problema-Solução-Problema) para manter o engajamento:
- Antes de cada seção importante, agite um problema ou dor
- Entregue a solução/conteúdo
- Introduza um novo problema que leva à próxima seção

Escreva o texto completo do corpo, dividido em seções claras.

## RESUMO / PONTE PARA CTA
Recapitule os principais pontos de forma rápida. Reforce a transformação que o espectador terá ao aplicar o conteúdo. Crie uma transição natural para o CTA.

Escreva o texto completo do resumo.

## CTA FINAL
${typeConfig.ctaInstructions}

Escreva o texto completo do CTA, incluindo:
- Chamada para like e inscrição (de forma criativa, não genérica)
- Sugestão de próximo vídeo
- Chamada para comentários

---

**IMPORTANTE:**
1. Escreva o roteiro COMPLETO, palavra por palavra, pronto para ser lido
2. Use a linguagem e tom de voz da persona
3. Foque nas dores e desejos do público-alvo
4. Seja específico e prático, não genérico
5. Inclua marcações [CORTE], [B-ROLL], [TEXTO NA TELA] quando apropriado
6. Mantenha parágrafos curtos para facilitar a leitura durante gravação`;

  return prompt;
}

/**
 * Retorna a configuração de um tipo de vídeo específico
 */
export function getVideoTypeConfig(videoType) {
  return VIDEO_TYPE_CONFIG[videoType] || null;
}

/**
 * Retorna todos os tipos de vídeo disponíveis
 */
export function getAllVideoTypes() {
  return Object.entries(VIDEO_TYPE_CONFIG).map(([id, config]) => ({
    id,
    ...config
  }));
}