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
import { base44 } from "@/api/base44Client";

export default function AgentSettings() {
  const [openModal, setOpenModal] = useState(null);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = AGENT_CARDS.filter(agent => 
    agent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      </AdminLayout>
    </AdminProtection>
  );
}