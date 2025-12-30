import React from 'react';
import { Settings } from 'lucide-react';
import PageHeader from "@/components/common/PageHeader";
import AgentCardGrid from "@/components/settings/AgentCardGrid";
import ChatSettingsModal from "@/components/chat/ChatSettingsModal";
import PostTypeSettingsModal from "@/components/instagram/PostTypeSettingsModal";
import { AGENT_CARDS } from "@/components/constants/agentCards";
import { useAgentSettings } from "@/components/hooks/useAgentSettings";

export default function AgentSettings() {
  const {
    openModal,
    showPostTypeModal,
    setShowPostTypeModal,
    currentConfig,
    handleOpenSettings,
    handleCloseModal
  } = useAgentSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações de Agentes"
        subtitle="Configure os modelos e prompts de cada agente de IA"
        icon={Settings}
      />

      <AgentCardGrid 
        agents={AGENT_CARDS} 
        onAgentClick={handleOpenSettings} 
      />

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

      <PostTypeSettingsModal
        open={showPostTypeModal}
        onOpenChange={setShowPostTypeModal}
      />
    </div>
  );
}