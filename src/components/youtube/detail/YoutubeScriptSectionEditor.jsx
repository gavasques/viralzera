import React, { useMemo, useRef, useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Save, MessageSquareText, Sparkles } from "lucide-react";
import RefinerButton from "@/components/youtube/refiner/RefinerButton";
import ScriptTextSelectionPopover from "./ScriptTextSelectionPopover";

const VIDEO_TYPE_COLORS = {
  tutorial: "bg-blue-100 text-blue-700",
  lista: "bg-purple-100 text-purple-700",
  dica_rapida: "bg-green-100 text-green-700",
  estudo_caso: "bg-amber-100 text-amber-700",
  comparacao: "bg-pink-100 text-pink-700",
  explicacao_conceito: "bg-indigo-100 text-indigo-700",
  desmistificacao: "bg-red-100 text-red-700",
  novidade: "bg-cyan-100 text-cyan-700",
  problema_solucao: "bg-orange-100 text-orange-700",
  historia_pessoal: "bg-violet-100 text-violet-700",
};

const STATUS_COLORS = {
  Rascunho: "bg-slate-100 text-slate-700",
  Finalizado: "bg-green-100 text-green-700",
  Publicado: "bg-blue-100 text-blue-700",
};

// Basic Markdown to HTML converter
const markdownToHtml = (text) => {
  if (!text) return '';
  
  // Check if it looks like HTML already (basic check)
  if (/<[a-z][\s\S]*>/i.test(text)) return text;

  let html = text
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Line breaks
    .replace(/\n/gim, '<br>');

  return html;
};

export default function YoutubeScriptSectionEditor({ 
  sectionKey,
  title, 
  description,
  content, 
  onChange,
  onOpenRefiner,
  scriptTitle = "",
  videoType,
  status,
  onSave,
  isSaving,
  hasChanges,
  onChatToggle
}) {
  const quillRef = useRef(null);
  const [selection, setSelection] = useState(null);

  // Handle selection change
  const handleSelectionChange = (range, source, editorProxy) => {
    // Only update if we have a valid range (ignore blur/null range to keep popover open)
    if (range) {
      if (range.length > 0) {
        const text = editorProxy.getText(range.index, range.length);
        
        if (!text.trim()) {
           setSelection(null);
           return;
        }

        // Get bounds using real Quill instance to ensure access to container
        try {
          const quill = quillRef.current.getEditor();
          const bounds = quill.getBounds(range.index, range.length);
          const editorContainer = quill.container;
          const editorRect = editorContainer.getBoundingClientRect();
          
          setSelection({
            range,
            text,
            position: {
              x: editorRect.left + bounds.left + (bounds.width / 2),
              y: editorRect.top + bounds.top,
              bottom: editorRect.top + bounds.bottom
            }
          });
        } catch (e) {
          console.error("Error getting bounds:", e);
        }
      } else {
        // Cursor moved but no selection (caret only) - close popover
        setSelection(null);
      }
    }
  };

  const handleReplaceText = (newText) => {
    if (quillRef.current && selection) {
      const editor = quillRef.current.getEditor();
      editor.deleteText(selection.range.index, selection.range.length);
      editor.insertText(selection.range.index, newText);
      setSelection(null);
    }
  };

  const handleInsertBelow = (newText) => {
    if (quillRef.current && selection) {
      const editor = quillRef.current.getEditor();
      const insertIndex = selection.range.index + selection.range.length;
      editor.insertText(insertIndex, '\n' + newText);
      setSelection(null);
    }
  };

  // Close selection on scroll logic removed to prevent menu closing during selection drag

  // Memoize initial content conversion to avoid re-rendering issues/loops with Quill
  // But we need to handle external updates if content changes from outside (e.g. refiner)
  // Quill handles value prop changes, but we need to be careful not to convert HTML back to Markdown here
  // because we are switching to HTML storage implicitly by using Quill.
  
  // However, if the content comes as Markdown (from generator), we need to convert it.
  // If it comes as HTML (from previous save), we keep it.
  const displayContent = useMemo(() => {
    return markdownToHtml(content);
  }, [content]);

  // Strip HTML for char count
  const plainText = content?.replace(/<[^>]*>/g, '') || '';
  const charCount = plainText.length;
  
  // Estimativa simples: ~150 palavras por minuto de fala, ~5 caracteres por palavra
  const estimatedSeconds = Math.round((charCount / 5) / 150 * 60);
  const estimatedTime = estimatedSeconds < 60 
    ? `~${estimatedSeconds}s`
    : `~${Math.round(estimatedSeconds / 60)}min`;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Editor Toolbar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          {/* Left: Info & Metadata */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                {title}
              </h3>
              <div className="flex items-center gap-2">
                {status && (
                  <Badge variant="secondary" className={`text-[10px] font-medium px-2 py-0.5 h-5 rounded-full ${STATUS_COLORS[status] || "bg-slate-100 text-slate-600"}`}>
                    {status}
                  </Badge>
                )}
                {videoType && (
                  <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0.5 h-5 rounded-full border-0 ${VIDEO_TYPE_COLORS[videoType] || "bg-slate-100 text-slate-600"}`}>
                    {videoType.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {description && <span>{description}</span>}
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="font-medium text-slate-600 tabular-nums">
                {charCount.toLocaleString()} chars
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-medium text-slate-600 tabular-nums">
                {estimatedTime} leitura
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={onChatToggle}
                className="h-9 px-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-full"
            >
                <Sparkles className="w-4 h-4 mr-2" />
                Recriar com IA
            </Button>

            <div className="w-px h-6 bg-slate-100 mx-2" />

            <div className="flex items-center gap-2">
                <RefinerButton onClick={() => onOpenRefiner(sectionKey)} />
                
                <Button 
                    onClick={onSave}
                    disabled={isSaving || !hasChanges}
                    size="sm"
                    variant={hasChanges ? "default" : "ghost"}
                    className={`h-9 min-w-[100px] transition-all duration-300 rounded-full ${
                        hasChanges 
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-100' 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    ) : hasChanges ? (
                        <Save className="w-3.5 h-3.5 mr-2" />
                    ) : (
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    )}
                    {isSaving ? 'Salvando...' : hasChanges ? 'Salvar' : 'Salvo'}
                </Button>
            </div>
          </div>
        </div>
      
        <div className="flex-1 overflow-hidden relative flex flex-col">
            <style>{`
            .ql-container {
                font-size: 1.1rem;
                border: none !important;
                height: 100%;
            }
            .ql-toolbar {
                border: none !important;
                border-bottom: 1px solid #f1f5f9 !important;
                padding: 12px 16px !important;
            }
            .ql-editor {
                font-size: 1.1rem;
                line-height: 1.8;
                padding: 32px 48px !important;
                height: 100%;
                overflow-y: auto;
            }
            `}</style>
            
            <div className="flex-1 flex flex-col min-h-0">
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={displayContent}
                    onChange={(val) => onChange(sectionKey, val)}
                    onChangeSelection={handleSelectionChange}
                    placeholder={`Escreva o conteúdo da seção ${title}...`}
                    className="flex-1 flex flex-col min-h-0"
                    modules={{
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        ['blockquote', 'code-block'],
                        ['clean']
                    ],
                    }}
                />
            </div>
            
            <ScriptTextSelectionPopover
            selectedText={selection?.text}
            position={selection?.position}
            onClose={() => setSelection(null)}
            onReplaceText={handleReplaceText}
            onInsertBelow={handleInsertBelow}
            fullContent={content}
            scriptTitle={scriptTitle}
            />
        </div>
    </div>
  );
}