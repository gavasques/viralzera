import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import YoutubeScriptHeader from "@/components/youtube/detail/YoutubeScriptHeader";
import SectionWithAI from "@/components/youtube/detail/SectionWithAI";
import AIAssistantDrawer from "@/components/youtube/detail/AIAssistantDrawer";
import { 
  parseScript, 
  rebuildScript, 
  getEmptySections,
  SCRIPT_SECTIONS 
} from "@/components/youtube/utils/parseYoutubeScript";

export default function YoutubeScriptDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const scriptId = urlParams.get('id');

  // Local state for editing
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState(getEmptySections());
  const [initialData, setInitialData] = useState(null);
  
  // AI Assistant state
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  // Fetch script data
  const { data: script, isLoading, error } = useQuery({
    queryKey: ['youtube-script', scriptId],
    queryFn: () => base44.entities.YoutubeScript.get(scriptId),
    enabled: !!scriptId,
  });

  // Parse script when data loads
  useEffect(() => {
    if (script) {
      setTitle(script.title || '');
      const parsedSections = parseScript(script.corpo);
      setSections(parsedSections);
      setInitialData({
        title: script.title || '',
        corpo: script.corpo || ''
      });
    }
  }, [script]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!initialData) return false;
    const currentCorpo = rebuildScript(sections);
    return title !== initialData.title || currentCorpo !== initialData.corpo;
  }, [title, sections, initialData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const corpo = rebuildScript(sections);
      return base44.entities.YoutubeScript.update(scriptId, {
        title,
        corpo
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-script', scriptId] });
      queryClient.invalidateQueries({ queryKey: ['youtube-scripts'] });
      setInitialData({
        title,
        corpo: rebuildScript(sections)
      });
      toast.success('Roteiro salvo com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + (error.message || 'Tente novamente'));
    }
  });

  // Handle section content change
  const handleSectionChange = (key, value) => {
    setSections(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle save
  const handleSave = () => {
    saveMutation.mutate();
  };

  // AI Assistant handlers
  const handleOpenAssistant = (sectionKey) => {
    setActiveSection(sectionKey);
    setAiDrawerOpen(true);
  };

  const handleAIReplace = (sectionKey, content) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: content
    }));
  };

  const handleAIInsertBelow = (sectionKey, content) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: (prev[sectionKey] || '') + '\n\n' + content
    }));
  };

  // Redirect if no ID
  if (!scriptId) {
    navigate(createPageUrl('YoutubeScripts'));
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-slate-500">Roteiro não encontrado</p>
        <button 
          onClick={() => navigate(createPageUrl('YoutubeScripts'))}
          className="text-red-500 hover:underline"
        >
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <YoutubeScriptHeader
        title={title}
        videoType={script?.video_type}
        status={script?.status}
        onTitleChange={setTitle}
        onSave={handleSave}
        isSaving={saveMutation.isPending}
        hasChanges={hasChanges}
      />

      <div className="space-y-6 pb-12">
        {SCRIPT_SECTIONS.map((section) => (
          <SectionWithAI
            key={section.key}
            sectionKey={section.key}
            title={section.title}
            description={section.description}
            value={sections[section.key]}
            onChange={handleSectionChange}
            onOpenAssistant={handleOpenAssistant}
          />
        ))}
      </div>

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        open={aiDrawerOpen}
        onOpenChange={setAiDrawerOpen}
        sectionKey={activeSection}
        sectionContent={activeSection ? sections[activeSection] : ''}
        scriptData={script}
        sections={sections}
        modelingIds={script?.modeling_ids || []}
        onReplace={handleAIReplace}
        onInsertBelow={handleAIInsertBelow}
      />
    </div>
  );
}