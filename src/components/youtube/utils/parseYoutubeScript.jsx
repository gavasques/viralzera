/**
 * Configuração das seções do roteiro YouTube
 * A ordem é importante para o parsing e reconstrução
 */
export const SCRIPT_SECTIONS = [
  { key: 'hook', label: 'HOOK', title: 'Hook (0-30s)', description: 'Primeiros segundos para capturar atenção' },
  { key: 'apresentacao', label: 'APRESENTAÇÃO', title: 'Apresentação (30s-1min)', description: 'Quem é você e por que devem ouvir' },
  { key: 'ponte', label: 'PONTE', title: 'Ponte (1-2min)', description: 'Transição para o conteúdo principal' },
  { key: 'corpo', label: 'CORPO', title: 'Corpo (Conteúdo Principal)', description: 'O conteúdo principal do vídeo' },
  { key: 'resumo', label: 'RESUMO', altLabels: ['RESUMO / PONTE PARA CTA'], title: 'Resumo', description: 'Recapitulação dos pontos principais' },
  { key: 'cta', label: 'CTA FINAL', altLabels: ['CTA'], title: 'CTA Final', description: 'Chamada para ação' },
];

/**
 * Cria um regex para encontrar o marcador de seção
 * Suporta variações como: 
 * - ## HOOK, ##HOOK, ## Hook
 * - ## HOOK (0-30s)
 * - **## HOOK (A Promessa em 5 Segundos)**
 * - **##HOOK**
 */
function createSectionRegex(label, altLabels = []) {
  const allLabels = [label, ...(altLabels || [])];
  const escapedLabels = allLabels.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escapedLabels.join('|');
  
  // Match: opcionalmente envolto em ** ou *, ## LABEL, possível texto em parênteses, e fechamento **
  return new RegExp(`^\\**##\\s*(${pattern})(?:\\s*\\([^)]*\\))?\\**\\s*$`, 'im');
}

/**
 * Faz o parsing do texto completo do roteiro em seções
 * @param {string} scriptBody - Texto completo do roteiro
 * @returns {Object} Objeto com as seções separadas
 */
export function parseScript(scriptBody) {
  if (!scriptBody || typeof scriptBody !== 'string') {
    return SCRIPT_SECTIONS.reduce((acc, section) => {
      acc[section.key] = '';
      return acc;
    }, {});
  }

  const result = {};
  let remainingText = scriptBody;

  // Para cada seção, encontra seu marcador e extrai o conteúdo até o próximo marcador
  SCRIPT_SECTIONS.forEach((section, index) => {
    const regex = createSectionRegex(section.label, section.altLabels);
    const nextSections = SCRIPT_SECTIONS.slice(index + 1);
    
    // Encontra onde esta seção começa
    const match = remainingText.match(regex);
    
    if (match) {
      const startIndex = match.index + match[0].length;
      let endIndex = remainingText.length;
      
      // Encontra onde a próxima seção começa
      for (const nextSection of nextSections) {
        const nextRegex = createSectionRegex(nextSection.label, nextSection.altLabels);
        const nextMatch = remainingText.slice(startIndex).match(nextRegex);
        
        if (nextMatch) {
          endIndex = startIndex + nextMatch.index;
          break;
        }
      }
      
      // Extrai o conteúdo da seção
      result[section.key] = remainingText
        .slice(startIndex, endIndex)
        .trim();
    } else {
      result[section.key] = '';
    }
  });

  return result;
}

/**
 * Reconstrói o texto completo do roteiro a partir das seções
 * @param {Object} sections - Objeto com as seções
 * @returns {string} Texto completo do roteiro
 */
export function rebuildScript(sections) {
  const parts = [];

  SCRIPT_SECTIONS.forEach(section => {
    const content = sections[section.key];
    if (content && content.trim()) {
      parts.push(`## ${section.label}\n\n${content.trim()}`);
    }
  });

  return parts.join('\n\n');
}

/**
 * Retorna o estado inicial vazio das seções
 */
export function getEmptySections() {
  return SCRIPT_SECTIONS.reduce((acc, section) => {
    acc[section.key] = '';
    return acc;
  }, {});
}