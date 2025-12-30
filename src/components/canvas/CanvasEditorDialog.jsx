import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CanvasRightPanel from "./CanvasRightPanel";
import TextSelectionPopover from "./TextSelectionPopover";
import CanvasEditorHeader from "./editor/CanvasEditorHeader";
import CanvasEditorToolbar from "./editor/CanvasEditorToolbar";
import CanvasEditorFooter from "./editor/CanvasEditorFooter";

export default function CanvasEditorDialog({ 
  open, 
  onOpenChange, 
  canvas, 
  onSave, 
  onSendToKanban,
  isSaving 
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedFolderId, setEditedFolderId] = useState("none");
  const [copied, setCopied] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const textareaRef = useRef(null);

  const startResizing = useCallback((mouseDownEvent) => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth > 250 && newWidth < 800) {
          setRightPanelWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const { data: folders = [] } = useQuery({
    queryKey: ['canvasFolders'],
    queryFn: () => base44.entities.CanvasFolder.list('name', 100),
  });

  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['canvasHistory', canvas?.id],
    queryFn: () => base44.entities.CanvasHistory.filter({ canvas_id: canvas?.id }, '-created_date', 50),
    enabled: !!canvas?.id
  });

  useEffect(() => {
    if (canvas) {
      setEditedTitle(canvas.title || "");
      setEditedContent(canvas.content || "");
      setEditedFolderId(canvas.folder_id || "none");
      setIsEditMode(false);
    }
  }, [canvas, open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    toast.success("Conteúdo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveInternal = async () => {
    if (canvas.content !== editedContent) {
      try {
        await base44.entities.CanvasHistory.create({
          canvas_id: canvas.id,
          content: canvas.content,
          version: history.length + 1,
          change_summary: 'Edição automática'
        });
        refetchHistory();
      } catch (err) {
        console.error("Erro ao salvar histórico", err);
      }
    }

    onSave({
      id: canvas.id,
      title: editedTitle,
      content: editedContent,
      folder_id: editedFolderId === "none" ? null : editedFolderId
    });
    setIsEditMode(false);
  };

  const handleRestoreHistory = (version) => {
    setEditedContent(version.content);
    setIsEditMode(true);
    toast.success("Conteúdo restaurado. Salve para confirmar.");
  };

  const handleSaveNotes = async (newNotes) => {
    try {
      await base44.entities.Canvas.update(canvas.id, { notes: newNotes });
      toast.success("Notas salvas!");
    } catch (err) {
      toast.error("Erro ao salvar notas");
    }
  };

  const currentFolder = folders.find(f => f.id === editedFolderId);

  const hasUnsavedChanges = isEditMode && (
    canvas?.title !== editedTitle || 
    canvas?.content !== editedContent ||
    (canvas?.folder_id || "none") !== editedFolderId
  );

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleSaveAndClose = async () => {
    setShowUnsavedDialog(false);
    await handleSaveInternal();
    onOpenChange(false);
  };

  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    
    if (selected && selected.length > 3) {
      const rect = textarea.getBoundingClientRect();
      const lineHeight = 24;
      const linesBefore = textarea.value.substring(0, textarea.selectionStart).split('\n').length;
      
      setSelectedText(selected);
      setSelectionPosition({
        x: rect.left + (rect.width / 2),
        y: rect.top + Math.min(linesBefore * lineHeight, rect.height / 2)
      });
    } else {
      setSelectedText('');
      setSelectionPosition(null);
    }
  }, []);

  const handleReplaceText = useCallback((oldText, newText) => {
    const newContent = editedContent.replace(oldText, newText);
    setEditedContent(newContent);
    setSelectedText('');
    setSelectionPosition(null);
  }, [editedContent]);

  const handleInsertEmoji = (emoji) => {
    if (!isEditMode) setIsEditMode(true);
    
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = 
        editedContent.substring(0, start) + 
        emoji + 
        editedContent.substring(end);
      
      setEditedContent(newContent);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setEditedContent(prev => prev + emoji);
    }
  };

  if (!canvas) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCloseAttempt();
      } else {
        onOpenChange(newOpen);
      }
    }}>
      <DialogContent className="max-w-[70vw] w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white shadow-2xl border-0 sm:rounded-xl">
        
        <CanvasEditorHeader />

        {/* Main Content Area - Flex Row */}
        <div className="flex-1 flex flex-row overflow-hidden min-h-0">
          
          {/* Left Column (Editor) - Flex Column */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
            
            <CanvasEditorToolbar 
              isEditMode={isEditMode}
              editedTitle={editedTitle}
              setEditedTitle={setEditedTitle}
              editedFolderId={editedFolderId}
              setEditedFolderId={setEditedFolderId}
              folders={folders}
              currentFolder={currentFolder}
              editedContent={editedContent}
              setIsEditMode={setIsEditMode}
              handleInsertEmoji={handleInsertEmoji}
              showRightPanel={showRightPanel}
              setShowRightPanel={setShowRightPanel}
              onSendToKanban={onSendToKanban}
              handleCopy={handleCopy}
              copied={copied}
            />

            {/* Scrollable Editor Content */}
            <div className="flex-1 overflow-y-auto relative flex flex-col min-h-0">
              <div className="max-w-none mx-4 flex flex-col bg-white shadow-sm my-4 rounded-xl border border-slate-200/60 flex-1 min-h-0">
                {isEditMode ? (
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Edit Mode Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-amber-50/50 rounded-t-xl">
                      <span className="text-xs font-medium text-amber-700">Modo Edição</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditMode(false)}
                        className="h-7 text-xs text-slate-500 hover:text-slate-700"
                      >
                        Sair do Modo Edição
                      </Button>
                    </div>
                    <Textarea
                      ref={textareaRef}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      onMouseUp={handleTextSelection}
                      onKeyUp={handleTextSelection}
                      placeholder="Comece a escrever aqui..."
                      className="w-full flex-1 p-6 text-base leading-relaxed resize-none border-0 focus-visible:ring-0 bg-transparent text-slate-800 focus:outline-none min-h-[200px]"
                    />
                    <div className="flex justify-end gap-2 p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                      <Button variant="outline" size="sm" onClick={() => setIsEditMode(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSaveInternal} 
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {isSaving ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full p-6 rounded-xl bg-transparent text-slate-800 whitespace-pre-wrap text-base leading-relaxed">
                    {editedContent || <span className="text-slate-400 italic">Sem conteúdo</span>}
                  </div>
                )}
              </div>
            </div>
            
            {/* Popover overlay */}
            {isEditMode && selectedText && selectionPosition && (
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
                <div className="pointer-events-auto">
                  <TextSelectionPopover
                    selectedText={selectedText}
                    position={selectionPosition}
                    onClose={() => {
                      setSelectedText('');
                      setSelectionPosition(null);
                    }}
                    onReplaceText={handleReplaceText}
                    fullContent={editedContent}
                    canvasTitle={editedTitle}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Resizable */}
          {showRightPanel && (
            <div 
              className="flex-shrink-0 border-l border-slate-200 z-10 bg-white relative flex flex-col"
              style={{ width: rightPanelWidth, height: '100%' }}
            >
              {/* Resize Handle */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 bg-transparent hover:bg-indigo-400 cursor-ew-resize z-50 transition-colors"
                onMouseDown={startResizing}
              />
              
              <div className="flex-1 min-h-0 overflow-hidden">
                <CanvasRightPanel
                  canvas={{...canvas, content: editedContent, title: editedTitle}}
                  onUpdateCanvas={(updates) => {
                    if (updates.content) setEditedContent(updates.content);
                    if (updates.title) setEditedTitle(updates.title);
                    setIsEditMode(true);
                  }}
                  history={history}
                  onRestoreHistory={handleRestoreHistory}
                  onSaveNotes={handleSaveNotes}
                  isSaving={isSaving}
                  onClose={() => setShowRightPanel(false)}
                />
              </div>
            </div>
          )}
        </div>

        <CanvasEditorFooter 
          isEditMode={isEditMode}
          isSaving={isSaving}
          onClose={handleCloseAttempt}
        />
      </DialogContent>
    </Dialog>

    <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem alterações que não foram salvas. Deseja salvar antes de sair?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDiscardAndClose}>
            Descartar
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleSaveAndClose} className="bg-indigo-600 hover:bg-indigo-700">
            Salvar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}