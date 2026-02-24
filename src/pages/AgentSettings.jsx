import React, { useState } from 'react';
import { Settings, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { AdminProtection } from '@/components/admin/AdminProtection';
import AdminLayout from '@/components/admin/AdminLayout';
import PageHeader from "@/components/common/PageHeader";
import ChatSettingsModal from "@/components/chat/ChatSettingsModal";
import PostTypeSettingsModal from "@/components/instagram/PostTypeSettingsModal";
import AgentCard from "@/components/settings/AgentCard";
import { AGENT_CONFIGS } from "@/components/constants/agentConfigs";
import { AGENT_CARDS } from "@/components/constants/agentCards";
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";

export default function AgentSettings() {
  const [openModal, setOpenModal] = useState(null);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all agent configs in parallel
  const { data: allConfigs = {} } = useQuery({
    queryKey: ['allAgentConfigs'],
    queryFn: async () => {
      const configEntities = [
        'AudienceConfig', 'PersonaConfig', 'ProductConfig', 'MaterialBankConfig',
        'DNAContentConfig', 'DNAConfig', 'TrendConfig', 'ScriptConfig', 'RefinerConfig',
        'CanvasConfig', 'ModelingConfig', 'YoutubeGeneratorConfig', 'YoutubeRefinerConfig',
        'YoutubeScriptEditorConfig', 'YoutubeTitleConfig', 'YoutubeKitGeneratorConfig',
        'YoutubeCreativeDirectiveConfig', 'YoutubeFormatSelectorConfig', 'YoutubePromptRefinerConfig',
        'ModelingAssistantConfig', 'ModelingScraperConfig', 'DossierGeneratorConfig',
        'ModelingAnalyzerConfig', 'ModelingTextAnalyzerConfig', 'ModelingLinkAnalyzerConfig', 
        'DeepResearchConfig', 'PostTypeConfig'
      ];
      
      const results = await Promise.all(
        configEntities.map(async (entity) => {
          try {
            const list = await neon.entities[entity].list('-created_date', 1);
            return { entity, config: list[0] || null };
          } catch {
            return { entity, config: null };
          }
        })
      );
      
      return results.reduce((acc, { entity, config }) => {
        acc[entity] = config;
        return acc;
      }, {});
    },
    staleTime: 1000 * 60 * 2, // 2 min cache
  });

  // Map agent key to config entity
  const getConfigForAgent = (agentKey) => {
    // Agentes com customModal (ex: postType/OCR) não têm configEntity no AGENT_CONFIGS
    // Verifica diretamente nos allConfigs usando o nome da entidade correspondente
    const agentConfig = AGENT_CONFIGS[agentKey];
    
    // PostType/OCR usa PostTypeConfig
    if (agentKey === 'postType') {
      return allConfigs['PostTypeConfig'] || null;
    }
    
    if (!agentConfig?.configEntity) return null;
    return allConfigs[agentConfig.configEntity] || null;
  };

  const filteredAgents = AGENT_CARDS.filter(agent => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    const config = getConfigForAgent(agent.key);
    
    // Buscar em múltiplos campos
    const searchableFields = [
      agent.title,
      agent.description,
      agent.key,
      config?.model_name,
      config?.model,
      config?.model1_name,
      config?.model2_name,
      config?.model3_name,
      config?.custom_title,
      config?.custom_description,
    ].filter(Boolean);
    
    return searchableFields.some(field => 
      field.toLowerCase().includes(search)
    );
  });

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
    <AdminProtection>
      <AdminLayout currentPage="AgentSettings">
        <div className="space-y-6">
      <PageHeader
        title="Configurações de Agentes"
        subtitle="Configure os modelos e prompts de cada agente de IA"
        icon={Settings}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Buscar agente..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <AgentCard 
            key={agent.key}
            agent={agent}
            config={getConfigForAgent(agent.key)}
            onClick={() => handleOpenSettings(agent.key)}
          />
        ))}
      </div>

      {/* Settings Modal */}
      {currentConfig && openModal && (
        <ChatSettingsModal
          open={!!openModal}
          onOpenChange={(open) => !open && handleCloseModal()}
          configEntity={currentConfig.configEntity}
          title={currentConfig.title}
          defaultPrompt={currentConfig.defaultPrompt}
          promptPlaceholders={currentConfig.promptPlaceholders}
          defaultTitle={AGENT_CARDS.find(a => a.key === openModal)?.title || ''}
          defaultDescription={AGENT_CARDS.find(a => a.key === openModal)?.description || ''}
        />
      )}

      {/* Post Type Settings Modal */}
      <PostTypeSettingsModal
        open={showPostTypeModal}
        onOpenChange={setShowPostTypeModal}
      />
        </div>
      </AdminLayout>
    </AdminProtection>
  );
}