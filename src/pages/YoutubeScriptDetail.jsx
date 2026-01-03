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
import YoutubeScriptChatDrawer from "@/components/youtube/detail/YoutubeScriptChatDrawer";
import YoutubeKitModal from "@/components/youtube/detail/YoutubeKitModal";
import ScriptHistoryDrawer from "@/components/youtube/history/ScriptHistoryDrawer";
import ScriptNotesPanel from "@/components/youtube/detail/ScriptNotesPanel";

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
  const [notesVisible, setNotesVisible] = useState(false);
  
  // Drawers & Modals state
  const [refinerOpen, setRefinerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showKitModal, setShowKitModal] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const pendingNavigation = useRef(null);

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

  // Warn before leaving page with unsaved changes (browser close/refresh)
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

  // Block browser back/forward navigation
  useEffect(() => {
    if (!hasChanges) return;
    
    // Push a dummy state to prevent immediate back navigation
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = (e) => {
      if (hasChanges) {
        // Push state again to prevent navigation
        window.history.pushState(null, '', window.location.href);
        // Show dialog
        pendingNavigation.current = () => {
          // Allow navigation by going back twice (once for our dummy, once for actual)
          window.history.go(-2);
        };
        setShowUnsavedDialog(true);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  // Save mutation (supports manual and auto save)
  const saveMutation = useMutation({
    mutationFn: async ({ isAutoSave = false } = {}) => {
      // 1. Update Script
      await base44.entities.YoutubeScript.update(scriptId, {
        title,
        corpo: content
      });

      // 2. Create Version
      await base44.entities.YoutubeScriptVersion.create({
        script_id: scriptId,
        title,
        corpo: content,
        video_type: script?.video_type,
        change_type: isAutoSave ? 'auto' : 'manual',
        change_description: isAutoSave ? "Auto Save" : "Salvo pelo usuário"
      });
      
      return { isAutoSave };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['script-versions', scriptId] });
      queryClient.invalidateQueries({ queryKey: ['youtube-script', scriptId] });
      queryClient.invalidateQueries({ queryKey: ['youtube-scripts'] });
      setInitialData({
        title,
        corpo: content
      });
      if (!variables?.isAutoSave) {
        toast.success('Roteiro salvo com sucesso!');
      } else {
        toast.success('Auto-save realizado', { duration: 2000 });
      }
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + (error.message || 'Tente novamente'));
    }
  });

  // Auto-save every 2 minutes when there are changes
  useEffect(() => {
    if (!hasChanges || !scriptId) return;
    
    const autoSaveInterval = setInterval(() => {
      if (hasChanges && !saveMutation.isPending) {
        saveMutation.mutate({ isAutoSave: true });
      }
    }, 2 * 60 * 1000); // 2 minutes
    
    return () => clearInterval(autoSaveInterval);
  }, [hasChanges, scriptId, saveMutation.isPending]);

  // Handle save (manual)
  const handleSave = () => {
    saveMutation.mutate({ isAutoSave: false });
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

  // Handle restore version
  const handleRestoreVersion = async (version) => {
    // 1. Save current state as backup
    await base44.entities.YoutubeScriptVersion.create({
      script_id: scriptId,
      title: title,
      corpo: content,
      video_type: script?.video_type,
      change_description: "Backup automático antes de restaurar versão"
    });

    // 2. Update local state
    setTitle(version.title);
    setContent(version.corpo);

    // 3. Update database
    await base44.entities.YoutubeScript.update(scriptId, {
      title: version.title,
      corpo: version.corpo
    });

    // 4. Reset unsaved state
    setInitialData({
      title: version.title,
      corpo: version.corpo
    });

    queryClient.invalidateQueries({ queryKey: ['youtube-script', scriptId] });
    queryClient.invalidateQueries({ queryKey: ['script-versions', scriptId] });
  };

  // Redirect if no ID
  if (!scriptId) {
    navigate(createPageUrl('YoutubeScripts'));
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-slate-50">
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
    <div className="flex flex-col h-screen bg-slate-50/50">
      {/* Header */}
      <div className="flex-none bg-white border-b border-slate-200 z-10 sticky top-0">
        <div className="max-w-7xl mx-auto">
          <YoutubeScriptHeader
            title={title}
            videoType={script?.video_type}
            status={script?.status}
            onTitleChange={setTitle}
            onSave={handleSave}
            isSaving={saveMutation.isPending}
            hasChanges={hasChanges}
            onSuggestTitles={() => setShowTitleModal(true)}
            onChatOpen={() => setChatOpen(true)}
            onGenerateKit={() => setShowKitModal(true)}
            onNavigateBack={handleNavigateBack}
            onHistoryOpen={() => setHistoryOpen(true)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto">
          <div className={`mx-auto p-6 md:p-8 pb-32 min-h-full transition-all ${notesVisible ? 'max-w-4xl' : 'max-w-5xl'}`}>
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
              onChatToggle={() => setChatOpen(true)}
              // Notes & Actions props
              notesVisible={notesVisible}
              onToggleNotes={() => setNotesVisible(!notesVisible)}
            />
          </div>
        </div>
        
        {/* Notes Panel */}
        <ScriptNotesPanel 
          scriptId={scriptId} 
          isOpen={notesVisible}
        />
      </div>

      {/* Drawers */}
      <YoutubeScriptChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        scriptId={scriptId}
        scriptContext={{
          title: title,
          content: content,
          videoType: script?.video_type,
          status: script?.status
        }}
        onReplaceContent={(newContent) => setContent(newContent)}
        onInsertContent={(newContent) => setContent(prev => prev + '\n\n' + newContent)}
      />

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

      {/* Modals */}
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

      <YoutubeKitModal
        open={showKitModal}
        onOpenChange={setShowKitModal}
        scriptContent={content}
        scriptTitle={title}
      />

      <ScriptHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        scriptId={scriptId}
        onRestore={handleRestoreVersion}
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