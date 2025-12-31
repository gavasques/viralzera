import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import YoutubeScriptHeader from "@/components/youtube/detail/YoutubeScriptHeader";
import YoutubeScriptSectionEditor from "@/components/youtube/detail/YoutubeScriptSectionEditor";
import RefinerDrawer from "@/components/youtube/refiner/RefinerDrawer";
import TitleSuggestionsModal from "@/components/youtube/detail/TitleSuggestionsModal";
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
  
  // Refiner drawer state
  const [refinerOpen, setRefinerOpen] = useState(false);
  const [refinerSection, setRefinerSection] = useState(null);
  
  // Title suggestions modal state
  const [showTitleModal, setShowTitleModal] = useState(false);

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

  // Handle refiner drawer
  const handleOpenRefiner = (sectionKey) => {
    setRefinerSection(sectionKey);
    setRefinerOpen(true);
  };

  // Handle replace from refiner
  const handleRefinerReplace = (sectionKey, newContent) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: newContent
    }));
    toast.success('Conteúdo substituído');
  };

  // Handle insert below from refiner
  const handleRefinerInsertBelow = (sectionKey, newContent) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey] + '\n\n' + newContent
    }));
    toast.success('Conteúdo inserido');
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
        onSuggestTitles={() => setShowTitleModal(true)}
      />

      <div className="space-y-6 pb-12">
        {SCRIPT_SECTIONS.map((section) => (
          <YoutubeScriptSectionEditor
            key={section.key}
            sectionKey={section.key}
            title={section.title}
            description={section.description}
            content={sections[section.key]}
            onChange={handleSectionChange}
            onOpenRefiner={handleOpenRefiner}
          />
        ))}
      </div>

      {/* Refiner Drawer */}
      <RefinerDrawer
        open={refinerOpen}
        onOpenChange={setRefinerOpen}
        sectionKey={refinerSection}
        sectionContent={refinerSection ? sections[refinerSection] : ''}
        scriptContext={{
          title: title,
          videoType: script?.video_type
        }}
        modelingIds={script?.modeling_ids}
        onReplace={handleRefinerReplace}
        onInsertBelow={handleRefinerInsertBelow}
      />

      {/* Title Suggestions Modal */}
      <TitleSuggestionsModal
        open={showTitleModal}
        onOpenChange={setShowTitleModal}
        scriptId={scriptId}
        onTitleSelected={(newTitle) => {
          setTitle(newTitle);
          setInitialData(prev => ({ ...prev, title: newTitle }));
        }}
      />
    </div>
  );
}