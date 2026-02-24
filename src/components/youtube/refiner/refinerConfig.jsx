/**
 * Configuração das opções de refinamento por seção
 */
export const REFINER_OPTIONS = {
  hook: {
    title: 'Hook',
    options: [
      {
        id: 'hook_alternatives',
        label: '3 Hooks Alternativos',
        description: 'Gere 3 versões diferentes do hook',
        prompt: 'Analise este hook de vídeo YouTube e crie 3 versões alternativas, cada uma com uma abordagem diferente (curiosidade, polêmica, promessa). Mantenha o mesmo tema mas varie a estrutura.'
      },
      {
        id: 'hook_contrarian',
        label: 'Mais Contraintuitivo',
        description: 'Adicione elemento surpresa ou contrário ao senso comum',
        prompt: 'Reescreva este hook tornando-o mais contraintuitivo. Use uma afirmação que vá contra o senso comum ou que surpreenda o espectador. Crie uma "quebra de padrão" mental.'
      },
      {
        id: 'hook_curiosity',
        label: 'Adicionar Curiosidade',
        description: 'Crie um loop de curiosidade irresistível',
        prompt: 'Reescreva este hook adicionando um forte elemento de curiosidade. Use técnicas como: pergunta intrigante, revelação parcial, promessa de segredo, ou cliffhanger. O espectador PRECISA continuar assistindo.'
      }
    ]
  },
  apresentacao: {
    title: 'Apresentação',
    options: [
      {
        id: 'apresentacao_personal',
        label: 'Tornar Mais Pessoal',
        description: 'Adicione elementos pessoais e conexão emocional',
        prompt: 'Reescreva esta apresentação tornando-a mais pessoal e humana. Adicione uma mini-história, vulnerabilidade ou experiência real que crie conexão com o espectador.'
      },
      {
        id: 'apresentacao_credibility',
        label: 'Adicionar Credibilidade',
        description: 'Reforce autoridade e prova social',
        prompt: 'Reescreva esta apresentação adicionando elementos de credibilidade: resultados alcançados, números específicos, tempo de experiência, ou reconhecimentos. Sem ser arrogante, mostre por que o espectador deve confiar.'
      },
      {
        id: 'apresentacao_shorter',
        label: 'Encurtar',
        description: 'Versão mais concisa e direta',
        prompt: 'Reescreva esta apresentação de forma mais concisa, mantendo apenas os elementos essenciais. Máximo 3-4 frases impactantes. Menos é mais.'
      }
    ]
  },
  ponte: {
    title: 'Ponte',
    options: [
      {
        id: 'ponte_expectation',
        label: 'Criar Mais Expectativa',
        description: 'Amplifique a antecipação do conteúdo',
        prompt: 'Reescreva esta ponte criando mais expectativa e antecipação. Use técnicas como: preview do que vem, promessa de transformação, ou "o que você vai aprender vai mudar X".'
      },
      {
        id: 'ponte_connect_hook',
        label: 'Conectar Melhor com Hook',
        description: 'Crie uma transição mais fluida do hook',
        prompt: 'Reescreva esta ponte criando uma conexão mais natural e fluida com o hook. A transição deve ser suave, retomando elementos do hook e expandindo para o conteúdo.'
      },
      {
        id: 'ponte_promise',
        label: 'Adicionar Promessa',
        description: 'Inclua uma promessa clara de valor',
        prompt: 'Reescreva esta ponte adicionando uma promessa clara e específica do que o espectador vai ganhar assistindo. Use formato: "Ao final deste vídeo, você vai [benefício específico]".'
      }
    ]
  },
  corpo: {
    title: 'Corpo',
    options: [
      {
        id: 'corpo_psp',
        label: 'Aplicar Técnica PSP',
        description: 'Adicione loops Problema-Solução-Problema',
        prompt: 'Reescreva este conteúdo aplicando a técnica PSP (Problema-Solução-Problema) de forma clara. Antes de cada seção importante, agite um problema. Entregue a solução. Introduza um novo problema que leva à próxima seção. Crie loops de engajamento.'
      },
      {
        id: 'corpo_more_topics',
        label: 'Adicionar Mais Tópicos',
        description: 'Expanda com pontos adicionais relevantes',
        prompt: 'Analise este conteúdo e sugira 3-5 tópicos adicionais que enriqueceriam o vídeo. Para cada tópico, escreva um parágrafo completo que poderia ser inserido. Mantenha o mesmo tom e estilo.'
      },
      {
        id: 'corpo_transitions',
        label: 'Melhorar Transições',
        description: 'Crie conexões mais fluidas entre seções',
        prompt: 'Reescreva este conteúdo melhorando as transições entre os tópicos. Cada seção deve fluir naturalmente para a próxima. Use frases de transição, callbacks, e conectores lógicos.'
      }
    ]
  },
  resumo: {
    title: 'Resumo',
    options: [
      {
        id: 'resumo_keypoints',
        label: 'Reforçar Pontos-Chave',
        description: 'Destaque os principais aprendizados',
        prompt: 'Reescreva este resumo destacando de forma mais clara e memorável os 3-5 pontos-chave do vídeo. Use formato que facilite a memorização (números, acrônimos, ou repetição).'
      },
      {
        id: 'resumo_urgency',
        label: 'Criar Urgência',
        description: 'Adicione senso de urgência para ação',
        prompt: 'Reescreva este resumo adicionando senso de urgência. Mostre o que o espectador perde se não aplicar o conteúdo AGORA. Use gatilhos de escassez de tempo ou oportunidade.'
      },
      {
        id: 'resumo_connect_cta',
        label: 'Conectar com CTA',
        description: 'Crie ponte natural para o call to action',
        prompt: 'Reescreva este resumo criando uma transição natural e persuasiva para o CTA. O resumo deve "preparar o terreno" para o que você vai pedir ao espectador fazer.'
      }
    ]
  },
  cta: {
    title: 'CTA Final',
    options: [
      {
        id: 'cta_alternatives',
        label: '5 CTAs Diferentes',
        description: 'Gere 5 opções de call to action',
        prompt: 'Crie 5 CTAs diferentes para este vídeo, cada um com uma abordagem: (1) Direto e simples, (2) Com benefício claro, (3) Com prova social, (4) Com urgência, (5) Com reciprocidade. Inclua pedido de like, inscrição e comentário de forma criativa.'
      },
      {
        id: 'cta_persuasive',
        label: 'Mais Persuasivo',
        description: 'Aumente o poder de convencimento',
        prompt: 'Reescreva este CTA tornando-o mais persuasivo. Use técnicas como: reciprocidade (você recebeu valor, agora...), compromisso (se você chegou até aqui...), prova social, ou escassez.'
      },
      {
        id: 'cta_urgency',
        label: 'Senso de Urgência',
        description: 'Adicione urgência para ação imediata',
        prompt: 'Reescreva este CTA adicionando forte senso de urgência. O espectador deve sentir que precisa agir AGORA (curtir, inscrever, comentar). Use gatilhos temporais e de oportunidade.'
      }
    ]
  }
};

/**
 * Retorna as opções de refinamento para uma seção específica
 */
export function getRefinerOptions(sectionKey) {
  return REFINER_OPTIONS[sectionKey] || null;
}

/**
 * Retorna todas as seções que têm refinamento disponível
 */
export function getRefinerSections() {
  return Object.keys(REFINER_OPTIONS);
}