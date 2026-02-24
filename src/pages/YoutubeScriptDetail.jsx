import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import YoutubeDescriptionGeneratorModal from "@/components/youtube/detail/YoutubeDescriptionGeneratorModal";
import ScriptHistoryDrawer from "@/components/youtube/history/ScriptHistoryDrawer";
import ScriptNotesPanel from "@/components/youtube/detail/ScriptNotesPanel";
import InitialVersionsPanel from "@/components/youtube/detail/InitialVersionsPanel";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";

export default function YoutubeScriptDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const scriptId = urlParams.get('id');

  // Local state for editing
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Rascunho');
  const [categoria, setCategoria] = useState('Genérico');
  const [initialData, setInitialData] = useState(null);
  const [notesVisible, setNotesVisible] = useState(false);
  
  // Drawers & Modals state
  const [refinerOpen, setRefinerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const pendingNavigation = useRef(null);

  // Fetch script data
  const { selectedFocusId } = useSelectedFocus();

  const { data: script, isLoading, error } = useQuery({
    queryKey: ['youtube-script', scriptId],
    queryFn: () => neon.entities.YoutubeScript.get(scriptId),
    enabled: !!scriptId,
    refetchOnWindowFocus: false, // Prevent auto-refresh on window focus
  });

  // Fetch initial versions
  const { data: initialVersions = [] } = useQuery({
    queryKey: ['initial-versions', scriptId],
    queryFn: async () => {
      const all = await neon.entities.YoutubeScriptVersion.filter({ 
        script_id: scriptId,
        change_type: 'initial'
      }, '-created_date');
      return all;
    },
    enabled: !!scriptId
  });

  // Reset initial data when scriptId changes
  useEffect(() => {
    setInitialData(null);
  }, [scriptId]);

  const [transcription, setTranscription] = useState('');

  // Load script when data loads (only if not initialized)
        useEffect(() => {
          if (script && !initialData) {
            setTitle(script.title || '');
            setContent(script.corpo || '');
            setTranscription(script.transcricao || '');
            setStatus(script.status || 'Rascunho');
            setCategoria(script.categoria || 'Genérico');
            setInitialData({
              title: script.title || '',
              corpo: script.corpo || '',
              status: script.status || 'Rascunho',
              categoria: script.categoria || 'Genérico'
            });
          }
        }, [script, initialData]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!initialData) return false;
    return title !== initialData.title || 
           content !== initialData.corpo || 
           status !== initialData.status || 
           categoria !== initialData.categoria;
  }, [title, content, status, categoria, initialData]);

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
    await saveMutation.mutateAsync({ isAutoSave: false });
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
      await neon.entities.YoutubeScript.update(scriptId, {
        title,
        corpo: content,
        transcricao: transcription,
        status,
        categoria
      });

      // 2. Create Version
      await neon.entities.YoutubeScriptVersion.create({
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
        corpo: content,
        status,
        categoria
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

  // Auto-save transcription changes with debounce
  const transcriptionTimeoutRef = useRef(null);
  useEffect(() => {
    if (!scriptId) return;
    
    if (transcriptionTimeoutRef.current) {
      clearTimeout(transcriptionTimeoutRef.current);
    }
    
    transcriptionTimeoutRef.current = setTimeout(() => {
      if (transcription !== script?.transcricao) {
        neon.entities.YoutubeScript.update(scriptId, { transcricao: transcription })
          .catch(err => console.error('Error auto-saving transcription:', err));
      }
    }, 1500); // Auto-save after 1.5 seconds of inactivity
    
    return () => {
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
      }
    };
  }, [transcription, scriptId, script?.transcricao]);

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
    await neon.entities.YoutubeScriptVersion.create({
      script_id: scriptId,
      title: title,
      corpo: content,
      video_type: script?.video_type,
      change_type: 'restore',
      change_description: "Backup automático antes de restaurar versão"
    });

    // 2. Update local state
    setTitle(version.title);
    setContent(version.corpo);

    // 3. Update database
    await neon.entities.YoutubeScript.update(scriptId, {
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

  const sendToKanbanMutation = useMutation({
    mutationFn: async () => {
      // 1. Find PostType "Youtube Vídeo Longo"
      // Try to find specifically for this focus first
      let postTypes = await neon.entities.PostType.filter({ title: 'Youtube Vídeo Longo', focus_id: selectedFocusId });
      let postTypeId = postTypes?.[0]?.id;

      // Fallback: try finding any post type with this name (maybe default one)
      if (!postTypeId) {
         const allPostTypes = await neon.entities.PostType.filter({ title: 'Youtube Vídeo Longo' });
         postTypeId = allPostTypes?.[0]?.id;
      }

      if (!postTypeId) {
        throw new Error("Tipo de postagem 'Youtube Vídeo Longo' não encontrado. Crie este tipo de postagem primeiro.");
      }

      // 2. Update script status to "Finalizado"
      await neon.entities.YoutubeScript.update(scriptId, {
        status: 'Finalizado'
      });

      // 3. Create Post
      return neon.entities.Post.create({
        focus_id: selectedFocusId,
        title: title || 'Sem título',
        content: content,
        status: 'review', // Status = Revisão
        post_type_id: postTypeId,
        platform: 'YouTube',
        priority: 'medium',
        notes: `Criado a partir do roteiro: ${window.location.origin}${window.location.pathname}?id=${scriptId}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-script', scriptId] });
      queryClient.invalidateQueries({ queryKey: ['youtube-scripts'] });
      toast.success('Enviado para o Kanban e status alterado para Finalizado!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar para Kanban: ' + error.message);
    }
  });

  const handleSendToKanban = () => {
      if (!selectedFocusId) {
          toast.error("Selecione um foco antes de enviar.");
          return;
      }
      sendToKanbanMutation.mutate();
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
    <div className="flex flex-col h-screen bg-[#F9FAFB]">
      {/* Header */}
      <YoutubeScriptHeader
        title={title}
        videoType={script?.video_type}
        status={status}
        categoria={categoria}
        onTitleChange={setTitle}
        onStatusChange={setStatus}
        onCategoriaChange={setCategoria}
        onSave={handleSave}
        isSaving={saveMutation.isPending}
        hasChanges={hasChanges}
        onSuggestTitles={() => setShowTitleModal(true)}
        onGenerateDescription={() => setShowDescriptionModal(true)}
        onNavigateBack={handleNavigateBack}
        onHistoryOpen={() => setHistoryOpen(true)}
        onSendToKanban={handleSendToKanban}
        isSendingToKanban={sendToKanbanMutation.isPending}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto">
          <div className={`mx-auto p-6 md:p-8 pb-32 min-h-full transition-all ${notesVisible ? 'max-w-4xl xl:max-w-5xl' : 'max-w-5xl'}`}>
            {/* Initial Versions Panel */}
            <InitialVersionsPanel
              scriptId={scriptId}
              onVersionSelected={(version) => {
                setTitle(version.title);
                setContent(version.corpo);
                setInitialData({
                  title: version.title,
                  corpo: version.corpo,
                  status,
                  categoria
                });
              }}
              currentContent={content}
            />

            {/* Show skeleton if no primary version selected yet */}
            {initialVersions.length > 1 && !initialVersions.some(v => v.is_primary) && (
              <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 mb-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      Aguardando Escolha da Versão Principal
                    </h3>
                    <p className="text-sm text-slate-500">
                      Selecione uma versão acima para começar a editar o roteiro
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Editor - só mostrar se tiver versão principal ou não tiver versões iniciais */}
            {(initialVersions.length <= 1 || initialVersions.some(v => v.is_primary)) && (
              <YoutubeScriptSectionEditor
                sectionKey="corpo"
                title="Roteiro Completo"
                description="Edite o conteúdo completo do roteiro"
                content={content}
                onChange={(_, val) => setContent(val)}
                onOpenRefiner={handleOpenRefiner}
                scriptTitle={title}
                videoType={script?.video_type}
                status={script?.status}
                onSave={handleSave}
                isSaving={saveMutation.isPending}
                hasChanges={hasChanges}
                onChatToggle={() => setChatOpen(true)}
                notesVisible={notesVisible}
                onToggleNotes={() => setNotesVisible(!notesVisible)}
                transcription={transcription}
                onTranscriptionChange={setTranscription}
              />
            )}
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

      <YoutubeDescriptionGeneratorModal
        open={showDescriptionModal}
        onOpenChange={setShowDescriptionModal}
        scriptTitle={title}
        scriptId={scriptId}
        transcription={transcription}
        onDescriptionGenerated={(desc) => {
          toast.success('Descrição gerada! Copie e use onde necessário.');
          setShowDescriptionModal(false);
        }}
      />

      <ScriptHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        scriptId={scriptId}
        onRestore={handleRestoreVersion}
      />

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 rounded-full px-6 h-12 gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-lg">Alterações não salvas</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600">
              Você tem alterações não salvas neste roteiro. Se sair agora, suas alterações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowUnsavedDialog(false)}
              className="w-full sm:w-auto order-1"
            >
              Continuar editando
            </Button>
            <Button
              onClick={handleDiscardChanges}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white order-2"
            >
              Descartar alterações
            </Button>
            <Button
              onClick={handleSaveAndLeave}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white order-3"
            >
              Salvar e sair
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}