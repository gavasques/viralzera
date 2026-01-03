import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import YoutubeScriptHeader from "@/components/youtube/detail/YoutubeScriptHeader";
import YoutubeScriptSectionEditor from "@/components/youtube/detail/YoutubeScriptSectionEditor";
import RefinerDrawer from "@/components/youtube/refiner/RefinerDrawer";
import TitleSuggestionsModal from "@/components/youtube/detail/TitleSuggestionsModal";
import YoutubeRightPanel from "@/components/youtube/detail/YoutubeRightPanel";
import YoutubeKitModal from "@/components/youtube/detail/YoutubeKitModal";
// import { 
//   parseScript, 
//   rebuildScript, 
//   getEmptySections,
//   SCRIPT_SECTIONS 
// } from "@/components/youtube/utils/parseYoutubeScript";

export default function YoutubeScriptDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const scriptId = urlParams.get('id');

  // Local state for editing
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [initialData, setInitialData] = useState(null);
  
  // Refiner drawer state
  const [refinerOpen, setRefinerOpen] = useState(false);
  
  // Title suggestions modal state
  const [showTitleModal, setShowTitleModal] = useState(false);
  
  // Kit modal state
  const [showKitModal, setShowKitModal] = useState(false);

  // Unsaved changes dialog state
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigation = useRef(null);

  // Right panel state
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  // Resizing logic
  const startResizing = React.useCallback(() => setIsResizing(true), []);
  const stopResizing = React.useCallback(() => setIsResizing(false), []);
  const resize = React.useCallback((e) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 250 && newWidth < 800) {
        setRightPanelWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Fetch script data
  const { data: script, isLoading, error } = useQuery({
    queryKey: ['youtube-script', scriptId],
    queryFn: () => base44.entities.YoutubeScript.get(scriptId),
    enabled: !!scriptId,
  });

  // Load script when data loads
  useEffect(() => {
    if (script) {
      setTitle(script.title || '');
      setContent(script.corpo || '');
      setInitialData({
        title: script.title || '',
        corpo: script.corpo || ''
      });
    }
  }, [script]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!initialData) return false;
    return title !== initialData.title || content !== initialData.corpo;
  }, [title, content, initialData]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Handle navigation with unsaved changes
  const handleNavigateBack = useCallback(() => {
    if (hasChanges) {
      pendingNavigation.current = () => navigate(createPageUrl('YoutubeScripts'));
      setShowUnsavedDialog(true);
    } else {
      navigate(createPageUrl('YoutubeScripts'));
    }
  }, [hasChanges, navigate]);

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation.current) {
      pendingNavigation.current();
      pendingNavigation.current = null;
    }
  };

  const handleSaveAndLeave = async () => {
    await saveMutation.mutateAsync();
    setShowUnsavedDialog(false);
    if (pendingNavigation.current) {
      pendingNavigation.current();
      pendingNavigation.current = null;
    }
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.YoutubeScript.update(scriptId, {
        title,
        corpo: content
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-script', scriptId] });
      queryClient.invalidateQueries({ queryKey: ['youtube-scripts'] });
      setInitialData({
        title,
        corpo: content
      });
      toast.success('Roteiro salvo com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + (error.message || 'Tente novamente'));
    }
  });

  // Handle save
  const handleSave = () => {
    saveMutation.mutate();
  };

  // Handle refiner drawer
  const handleOpenRefiner = () => {
    setRefinerOpen(true);
  };

  // Handle replace from refiner
  const handleRefinerReplace = (sectionKey, newContent) => {
    setContent(newContent);
    toast.success('Conteúdo substituído');
  };

  // Handle insert below from refiner
  const handleRefinerInsertBelow = (sectionKey, newContent) => {
    setContent(prev => prev + '\n\n' + newContent);
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
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <YoutubeScriptHeader
        title={title}
        videoType={script?.video_type}
        status={script?.status}
        onTitleChange={setTitle}
        onSave={handleSave}
        isSaving={saveMutation.isPending}
        hasChanges={hasChanges}
        onSuggestTitles={() => setShowTitleModal(true)}
        onChatOpen={() => setShowRightPanel(true)}
        onGenerateKit={() => setShowKitModal(true)}
        onNavigateBack={handleNavigateBack}
      />

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-140px)]">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <YoutubeScriptSectionEditor
              sectionKey="corpo"
              title="Roteiro Completo"
              description="Edite o conteúdo completo do roteiro"
              content={content}
              onChange={(_, val) => setContent(val)}
              onOpenRefiner={handleOpenRefiner}
              scriptTitle={title}
              // Toolbar props
              videoType={script?.video_type}
              status={script?.status}
              onSave={handleSave}
              isSaving={saveMutation.isPending}
              hasChanges={hasChanges}
              onChatToggle={() => setShowRightPanel(prev => !prev)}
            />
          </div>
        </div>

        {/* Right Panel */}
        {showRightPanel && (
          <div 
            className="flex-shrink-0 z-10 relative flex flex-col h-full"
            style={{ width: rightPanelWidth }}
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 bg-transparent hover:bg-red-400 cursor-ew-resize z-50 transition-colors"
              onMouseDown={startResizing}
            />
            
            <YoutubeRightPanel 
              scriptId={scriptId}
              scriptContext={{
                title: title,
                content: content,
                videoType: script?.video_type,
                status: script?.status
              }}
              onClose={() => setShowRightPanel(false)}
            />
          </div>
        )}
      </div>

      {/* Refiner Drawer */}
      <RefinerDrawer
        open={refinerOpen}
        onOpenChange={setRefinerOpen}
        sectionKey="corpo"
        sectionContent={content}
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
        content={content}
        onTitleSelected={(newTitle) => {
          setTitle(newTitle);
          setInitialData(prev => ({ ...prev, title: newTitle }));
        }}
      />

      {/* Kit YouTube Modal */}
      <YoutubeKitModal
        open={showKitModal}
        onOpenChange={setShowKitModal}
        scriptContent={content}
        scriptTitle={title}
      />

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas neste roteiro. O que deseja fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardChanges}
              className="bg-red-600 hover:bg-red-700"
            >
              Descartar
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleSaveAndLeave}
              className="bg-green-600 hover:bg-green-700"
            >
              Salvar e Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}