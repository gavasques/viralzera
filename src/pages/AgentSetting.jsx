import React, { useState } from 'react';
import { Settings, Users, User, Package, Library, Dna, TrendingUp, Sparkles, ScrollText, Layers, ImageIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import ChatSettingsModal from "@/components/chat/ChatSettingsModal";
import PostTypeSettingsModal from "@/components/instagram/PostTypeSettingsModal";
import { AGENT_CONFIGS } from "@/components/constants/agentConfigs";

const AGENT_CARDS = [
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

export default function AgentSettings() {
  const [openModal, setOpenModal] = useState(null);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);

  const handleOpenSettings = (agentKey) => {
    const agent = AGENT_CARDS.find(a => a.key === agentKey);
    if (agent?.customModal) {
      if (agentKey === 'postType') {
        setShowPostTypeModal(true);
      }
    } else {
      setOpenModal(agentKey);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(null);
  };

  const currentConfig = openModal ? AGENT_CONFIGS[openModal] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações de Agentes"
        subtitle="Configure os modelos e prompts de cada agente de IA"
        icon={Settings}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENT_CARDS.map((agent) => (
          <Card 
            key={agent.key}
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => handleOpenSettings(agent.key)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${agent.color} text-white shrink-0`}>
                  <agent.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {agent.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {agent.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t flex justify-end">
                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Settings Modal */}
      {currentConfig && (
        <ChatSettingsModal
          open={!!openModal}
          onOpenChange={(open) => !open && handleCloseModal()}
          configEntity={currentConfig.configEntity}
          title={currentConfig.title}
          defaultPrompt={currentConfig.defaultPrompt}
          promptPlaceholders={currentConfig.promptPlaceholders}
        />
      )}

      {/* Post Type Settings Modal */}
      <PostTypeSettingsModal
        open={showPostTypeModal}
        onOpenChange={setShowPostTypeModal}
      />
    </div>
  );
}
