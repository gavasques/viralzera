/**
 * Utilitário para montar o prompt final do YouTube Script Generator
 * Substitui placeholders no template com dados reais
 */

/**
 * Formata dados da Persona para inclusão no prompt
 */
function formatPersona(persona) {
  if (!persona) return 'Não especificada';
  
  const parts = [];
  parts.push(`Nome: ${persona.name || 'N/A'}`);
  
  if (persona.who_am_i) {
    parts.push(`Quem sou eu: ${persona.who_am_i}`);
  }
  
  if (persona.tone_of_voice) {
    const toneStr = typeof persona.tone_of_voice === 'object' 
      ? JSON.stringify(persona.tone_of_voice, null, 2)
      : persona.tone_of_voice;
    parts.push(`Tom de voz: ${toneStr}`);
  }
  
  if (persona.thoughts_phrases) {
    const phrasesStr = typeof persona.thoughts_phrases === 'object'
      ? JSON.stringify(persona.thoughts_phrases, null, 2)
      : persona.thoughts_phrases;
    parts.push(`Frases e pensamentos: ${phrasesStr}`);
  }
  
  if (persona.hobbies?.length > 0) {
    parts.push(`Hobbies: ${persona.hobbies.join(', ')}`);
  }
  
  return parts.join('\n');
}

/**
 * Formata dados do Público-Alvo para inclusão no prompt
 */
function formatAudience(audience) {
  if (!audience) return 'Não especificado';
  
  const parts = [];
  parts.push(`Nome: ${audience.name || 'N/A'}`);
  parts.push(`Etapa do Funil: ${audience.funnel_stage || 'N/A'}`);
  
  if (audience.description) {
    parts.push(`Descrição: ${audience.description}`);
  }
  
  if (audience.pains) {
    parts.push(`Dores: ${audience.pains}`);
  }
  
  if (audience.ambitions) {
    parts.push(`Ambições: ${audience.ambitions}`);
  }
  
  if (audience.habits) {
    parts.push(`Hábitos: ${audience.habits}`);
  }
  
  if (audience.common_enemy) {
    parts.push(`Inimigo comum: ${audience.common_enemy}`);
  }
  
  return parts.join('\n');
}

/**
 * Formata materiais de referência para inclusão no prompt
 */
function formatMaterials(materials) {
  if (!materials || materials.length === 0) return 'Nenhum material selecionado';
  
  return materials.map((m, i) => {
    return `### Material ${i + 1}: ${m.title}\n${m.content}`;
  }).join('\n\n');
}

/**
 * Formata conteúdo das modelagens para inclusão no prompt
 */
function formatModelings(modelingsContent) {
  if (!modelingsContent || modelingsContent.length === 0) return 'Nenhuma modelagem selecionada';
  
  return modelingsContent.map((m, i) => {
    const parts = [`### Referência ${i + 1}: ${m.title}`];
    
    if (m.creatorIdea) {
      parts.push(`**Ideia do Criador:** ${m.creatorIdea}`);
    }
    
    if (m.transcripts?.length > 0) {
      parts.push('\n**Transcrições:**');
      m.transcripts.forEach(t => {
        parts.push(`- ${t.title}: ${t.content?.substring(0, 500)}...`);
      });
    }
    
    if (m.texts?.length > 0) {
      parts.push('\n**Textos de Referência:**');
      m.texts.forEach(t => {
        parts.push(`- ${t.title}: ${t.content?.substring(0, 300)}...`);
      });
    }
    
    return parts.join('\n');
  }).join('\n\n---\n\n');
}

/**
 * Formata introdução padrão do usuário
 */
function formatIntroduction(introduction) {
  if (!introduction) return '';
  return `\n\n## INTRODUÇÃO PADRÃO DO CRIADOR\nINICIO INTRODUÇÃO\n${introduction.content}\nFIM INTRODUÇÃO`;
}

/**
 * Formata CTA padrão do usuário
 */
function formatCTA(cta) {
  if (!cta) return '';
  return `\n\n## CTA PADRÃO DO CRIADOR\nINICIO CTA\n${cta.content}\nFIM CTA`;
}

/**
 * Monta o prompt final substituindo placeholders no template
 * @param {Object} params - Parâmetros para montagem do prompt
 * @param {string} params.promptTemplate - Template do prompt do tipo de roteiro
 * @param {string} params.tema - Tema central do vídeo
 * @param {Object} params.persona - Dados da persona
 * @param {Object} params.audience - Dados do público-alvo
 * @param {Array} params.materials - Lista de materiais selecionados
 * @param {Array} params.modelingsContent - Conteúdo das modelagens
 * @param {Object} params.introduction - Introdução padrão do usuário
 * @param {Object} params.cta - CTA padrão do usuário
 * @param {string} params.userNotes - Notas adicionais do usuário
 * @param {number} params.duracaoEstimada - Duração estimada em minutos
 * @param {string} params.videoType - Nome do tipo de vídeo
 */
export function buildYoutubePrompt({
  promptTemplate,
  tema,
  persona,
  audience,
  materials,
  modelingsContent,
  introduction,
  cta,
  userNotes,
  duracaoEstimada,
  videoType
}) {
  // Se não há template customizado, usa um padrão
  const baseTemplate = promptTemplate || getDefaultPromptTemplate();
  
  // Formata intro e CTA para substituição nos placeholders
  const introContent = introduction?.content || 'Não especificada';
  const ctaContent = cta?.content || 'Não especificado';

  // Substitui placeholders
  let finalPrompt = baseTemplate
    .replace(/\{\{tema\}\}/gi, tema || 'Não especificado')
    .replace(/\{\{video_type\}\}/gi, videoType || 'Não especificado')
    .replace(/\{\{duracao\}\}/gi, duracaoEstimada ? `${duracaoEstimada} minutos (considerando velocidade média de fala de 130 palavras/min, o roteiro deve ter aproximadamente ${parseInt(duracaoEstimada) * 130} palavras)` : 'Não especificada')
    .replace(/\{\{persona\}\}/gi, formatPersona(persona))
    .replace(/\{\{publico\}\}/gi, formatAudience(audience))
    .replace(/\{\{materiais\}\}/gi, formatMaterials(materials))
    .replace(/\{\{modelagens\}\}/gi, formatModelings(modelingsContent))
    .replace(/\{\{intros\}\}/gi, introContent)
    .replace(/\{\{ctas\}\}/gi, ctaContent);

  // Adiciona introdução e CTA ao final se existirem e se não foram substituídos via placeholders
  const hasIntroPlaceholder = /\{\{intros\}\}/gi.test(baseTemplate);
  const hasCtaPlaceholder = /\{\{ctas\}\}/gi.test(baseTemplate);
  
  if (!hasIntroPlaceholder) {
    finalPrompt += formatIntroduction(introduction);
  }
  if (!hasCtaPlaceholder) {
    finalPrompt += formatCTA(cta);
  }
  
  // Adiciona notas do usuário se existirem
  if (userNotes?.trim()) {
    finalPrompt += `\n\n## INSTRUÇÕES ADICIONAIS DO CRIADOR\nINICIO INSTRUÇÕES ADICIONAIS\n${userNotes}\nFIM INSTRUÇÕES ADICIONAIS`;
  }

  return finalPrompt;
}

/**
 * Template padrão caso o tipo de roteiro não tenha um template customizado
 */
function getDefaultPromptTemplate() {
  return `# CRIAR ROTEIRO DE YOUTUBE

## TEMA CENTRAL
INICIO TEMA CENTRAL
{{tema}}
FIM TEMA CENTRAL

## TIPO DE VÍDEO
INICIO TIPO DE VÍDEO
{{video_type}}
FIM TIPO DE VÍDEO

## DURAÇÃO ESTIMADA
INICIO DURAÇÃO ESTIMADA
{{duracao}}
FIM DURAÇÃO ESTIMADA

## PERSONA DO CRIADOR
INICIO PERSONA DO CRIADOR
{{persona}}
FIM PERSONA DO CRIADOR

## PÚBLICO-ALVO
INICIO PÚBLICO-ALVO
{{publico}}
FIM PÚBLICO-ALVO

## MATERIAIS DE REFERÊNCIA
INICIO MATERIAIS DE REFERÊNCIA
{{materiais}}
FIM MATERIAIS DE REFERÊNCIA

## MODELAGENS E REFERÊNCIAS DE SUCESSO
INICIO MODELAGENS E REFERÊNCIAS DE SUCESSO
{{modelagens}}
FIM MODELAGENS E REFERÊNCIAS DE SUCESSO

---

## INSTRUÇÕES

Crie um roteiro completo para YouTube.
O roteiro deve fluir naturalmente, contendo Hook, Apresentação, Conteúdo Principal e CTA.

O roteiro deve:
- Usar o tom de voz da persona
- Falar diretamente com o público-alvo
- Incorporar referências dos materiais selecionados
- Seguir o estilo das modelagens de sucesso
- Ser escrito como um texto único e coeso, pronto para gravação.
- Traga o retorno tudo junto, sem separar em seções rígidas.`;
}