import { 
  Users, User, Package, Library, Dna, 
  TrendingUp, Sparkles, ScrollText, Layers, ImageIcon 
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
  }
];