import { 
  Users, User, Package, Library, Dna, 
  TrendingUp, Sparkles, ScrollText, Layers, ImageIcon, BrainCircuit, Youtube, Wand2, PenLine,
  Type, MessageSquare, Link, FileText, Search, Microscope
} from 'lucide-react';

export const AGENT_CARDS = [
  {
    key: 'audience',
    title: 'Agente de Público-Alvo',
    description: 'Gera perfis de público para diferentes etapas do funil',
    icon: Users,
    color: 'bg-blue-500'
  },
  {
    key: 'persona',
    title: 'Gerador de Personas',
    description: 'Entrevista e extrai a essência para criar perfis de persona',
    icon: User,
    color: 'bg-purple-500'
  },
  {
    key: 'product',
    title: 'Analisador de Produtos',
    description: 'Analisa produtos e gera insights estratégicos',
    icon: Package,
    color: 'bg-green-500'
  },
  {
    key: 'material',
    title: 'Banco de Listas',
    description: 'Extrai informações estruturadas de PDFs e documentos',
    icon: Library,
    color: 'bg-amber-500'
  },
  {
    key: 'dnaContent',
    title: 'DNA - Transcrição e Análise',
    description: 'Analisa transcrições para extrair padrões de comunicação',
    icon: Dna,
    color: 'bg-pink-500'
  },
  {
    key: 'dnaProfile',
    title: 'DNA - Geração de Perfil',
    description: 'Agrega análises e gera perfil de DNA de comunicação',
    icon: Dna,
    color: 'bg-rose-500'
  },
  {
    key: 'trend',
    title: 'Tendências',
    description: 'Pesquisa tendências e notícias relevantes',
    icon: TrendingUp,
    color: 'bg-cyan-500'
  },
  {
    key: 'script',
    title: 'Gerador de Scripts',
    description: 'Cria scripts magnéticos para redes sociais',
    icon: Sparkles,
    color: 'bg-indigo-500'
  },
  {
    key: 'refiner',
    title: 'Refinador de Prompt',
    description: 'Refina prompts para obter melhores resultados',
    icon: ScrollText,
    color: 'bg-slate-500'
  },
  {
    key: 'modeling',
    title: 'Modelagem - Transcrição',
    description: 'Transcreve vídeos para análise de conteúdo',
    icon: Layers,
    color: 'bg-orange-500'
  },
  {
    key: 'canvas',
    title: 'Canvas (IA)',
    description: 'Configure o modelo e prompt para edição de Canvas com IA',
    icon: Sparkles,
    color: 'bg-violet-500'
  },
  {
    key: 'postType',
    title: 'Tipos de Postagens (OCR)',
    description: 'Configure os modelos de IA para OCR e Análise em Tipos de Postagens',
    icon: ImageIcon,
    color: 'bg-teal-500',
    customModal: true
  },
  {
    key: 'youtubeCreativeDirective',
    title: 'YouTube - Diretriz Criativa',
    description: 'Analisa o Dossiê e define a Tese, Porquê, Ângulo e Conflito do vídeo',
    icon: BrainCircuit,
    color: 'bg-yellow-500'
  },
  {
    key: 'youtubeFormatSelector',
    title: 'YouTube - Seletor de Formato',
    description: 'Recomenda o melhor formato de vídeo baseado na Diretriz Criativa',
    icon: Youtube,
    color: 'bg-red-400'
  },
  {
    key: 'youtubePromptRefiner',
    title: 'YouTube - Refinador de Prompt',
    description: 'Transforma o prompt bruto em um briefing completo e estruturado',
    icon: Wand2,
    color: 'bg-red-500'
  },
  {
    key: 'youtubeScriptGenerator',
    title: 'YouTube - Geração de Roteiro',
    description: 'Agente principal que gera o corpo do roteiro com base no tipo e contexto',
    icon: Youtube,
    color: 'bg-red-600'
  },
  {
    key: 'youtubeScriptRefiner',
    title: 'YouTube - Refinador de Seções',
    description: 'Refina seções específicas do roteiro (hook, cta, etc)',
    icon: Sparkles,
    color: 'bg-red-400'
  },
  {
    key: 'youtubeScriptEditor',
    title: 'Roteiros - Edição Notion',
    description: 'Agente para edição de trechos selecionados (Melhorar, Expandir, Resumir)',
    icon: PenLine,
    color: 'bg-indigo-600'
  },
  {
    key: 'youtubeTitleGenerator',
    title: 'YouTube - Gerador de Títulos',
    description: 'Gera títulos magnéticos e chamativos para vídeos',
    icon: Type,
    color: 'bg-amber-500'
  },
  {
    key: 'youtubeKitGenerator',
    title: 'YouTube - Gerador de Descrição',
    description: 'Gera descrição otimizada para SEO a partir da transcrição do vídeo',
    icon: Youtube,
    color: 'bg-red-600'
  },
  {
    key: 'modelingAssistant',
    title: 'Modelagem - Assistente',
    description: 'Assistente de brainstorming para o Laboratório de Ideias',
    icon: MessageSquare,
    color: 'bg-emerald-500'
  },
  {
    key: 'modelingScraper',
    title: 'Modelagem - Leitor de Links',
    description: 'Extrai e resume conteúdo de artigos e links',
    icon: Link,
    color: 'bg-sky-500'
  },
  {
    key: 'dossierGenerator',
    title: 'Modelagem - Gerador de Dossiê',
    description: 'Organiza materiais brutos em um dossiê estruturado',
    icon: FileText,
    color: 'bg-violet-500'
  },
  {
    key: 'modelingAnalyzer',
    title: 'Analisador Individual (Vídeos)',
    description: 'Analisa vídeos individualmente extraindo insights',
    icon: Microscope,
    color: 'bg-fuchsia-500',
    category: 'youtube'
  },
  {
    key: 'modelingTextAnalyzer',
    title: 'Analisador de Textos',
    description: 'Analisa textos e pesquisas extraindo insights e tópicos-chave',
    icon: FileText,
    color: 'bg-blue-600',
    category: 'youtube'
  },
  {
    key: 'deepResearch',
    title: 'Deep Research',
    description: 'Pesquisa avançada com Web Search e raciocínio profundo',
    icon: Search,
    color: 'bg-blue-600'
  },
  {
    key: 'modelingLinkAnalyzer',
    title: 'Analisador de Links',
    description: 'Analisa resumos de links e artigos extraindo insights',
    icon: Link,
    color: 'bg-sky-600',
    category: 'youtube'
  }
];