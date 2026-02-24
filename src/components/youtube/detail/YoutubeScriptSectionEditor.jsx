import React, { useMemo, useRef, useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Save, 
  MessageSquareText, 
  Sparkles, 
  Info, 
  Copy, 
  Download, 
  StickyNote, 
  EyeOff 
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
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

// Convert HTML to Markdown for clean export
const htmlToMarkdown = (htmlContent) => {
  if (!htmlContent) return '';

  // Create temp element
  const div = document.createElement('div');
  div.innerHTML = htmlContent;

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tagName = node.tagName.toLowerCase();
    let inner = '';
    
    // Handle children
    Array.from(node.childNodes).forEach(child => {
      inner += processNode(child);
    });

    switch (tagName) {
      case 'h1': return `# ${inner}\n\n`;
      case 'h2': return `## ${inner}\n\n`;
      case 'h3': return `### ${inner}\n\n`;
      case 'h4': return `#### ${inner}\n\n`;
      case 'h5': return `##### ${inner}\n\n`;
      case 'h6': return `###### ${inner}\n\n`;
      case 'p': return `${inner}\n\n`;
      case 'br': return '\n';
      case 'div': return `${inner}\n`;
      case 'strong':
      case 'b': return `**${inner}**`;
      case 'em':
      case 'i': return `*${inner}*`;
      case 'u': return inner;
      case 'strike':
      case 's': return `~~${inner}~~`;
      case 'blockquote': return `> ${inner}\n\n`;
      case 'code': return `\`${inner}\``;
      case 'pre': return `\`\`\`\n${inner}\n\`\`\`\n\n`;
      case 'ul': return `${inner}\n`;
      case 'ol': return `${inner}\n`;
      case 'li': return `- ${inner}\n`;
      default: return inner;
    }
  }

  let markdown = '';
  Array.from(div.childNodes).forEach(node => {
    markdown += processNode(node);
  });

  // Clean up excessive newlines
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
    onChatToggle,
    notesVisible,
    onToggleNotes,
    transcription = "",
    onTranscriptionChange
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

  const handleCopy = async () => {
    const text = htmlToMarkdown(content);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Roteiro copiado (Markdown)');
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  const handleDownloadTxt = () => {
    const text = htmlToMarkdown(content);
    const fileName = `${scriptTitle || 'roteiro'}.txt`.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Roteiro baixado como TXT');
  };

  return (
          <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Transcrição (se houver) */}
              {sectionKey === "corpo" && (
                <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
                  <details className="text-sm">
                    <summary className="font-medium text-blue-900 cursor-pointer flex items-center gap-2">
                      <span>📝 Transcrição com Timestamps</span>
                    </summary>
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={transcription}
                        onChange={(e) => onTranscriptionChange?.(e.target.value)}
                        placeholder="Cole aqui a transcrição do vídeo com timestamps (ex: [00:00] Introdução...)"
                        className="w-full h-20 p-2 text-xs border border-blue-200 rounded bg-white font-mono resize-none"
                      />
                      <p className="text-xs text-blue-700">Esta transcrição será usada para gerar descrições e outros elementos.</p>
                    </div>
                  </details>
                </div>
              )}

              {/* Modern Editor Header - Sticky */}
              <div className="flex flex-col gap-4 px-6 pt-5 pb-2 bg-white sticky top-0 z-10 border-b border-slate-100">
          <div className="flex items-center justify-between">
            {/* Left: Info & Metadata */}
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
              
              <div className="flex items-center gap-2">
                {status && (
                  <Badge variant="secondary" className={`text-[10px] font-medium px-2 py-0.5 h-5 rounded-md ${STATUS_COLORS[status] || "bg-slate-100 text-slate-600"}`}>
                    {status}
                  </Badge>
                )}
                {videoType && (
                  <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0.5 h-5 rounded-md border-0 ${VIDEO_TYPE_COLORS[videoType] || "bg-slate-100 text-slate-600"}`}>
                    {videoType.replace(/_/g, ' ')}
                  </Badge>
                )}

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600 rounded-full ml-1">
                      <Info className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="start">
                    <div className="flex gap-6">
                      <div className="flex flex-col">
                          <span className="font-bold text-slate-900 tabular-nums text-lg leading-none">{charCount.toLocaleString()}</span>
                          <span className="text-xs text-slate-500 mt-1">caracteres</span>
                      </div>
                      <div className="w-px bg-slate-100 h-auto" />
                      <div className="flex flex-col">
                          <span className="font-bold text-slate-900 tabular-nums text-lg leading-none">{estimatedTime}</span>
                          <span className="text-xs text-slate-500 mt-1">tempo de leitura</span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              <Button
                  variant="ghost"
                  size="sm"
                  onClick={onChatToggle}
                  className="h-8 px-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-md gap-2"
              >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-medium">Recriar com IA</span>
              </Button>

              <div className="w-px h-5 bg-slate-200 mx-2" />
              
              <RefinerButton onClick={() => onOpenRefiner(sectionKey)} />
              
              <Button 
                  onClick={handleCopy}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md"
                  title="Copiar Roteiro"
              >
                  <Copy className="w-4 h-4" />
              </Button>

              <Button 
                  onClick={handleDownloadTxt}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md"
                  title="Baixar TXT"
              >
                  <Download className="w-4 h-4" />
              </Button>

              <Button 
                  onClick={onToggleNotes}
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-md transition-colors ${
                    notesVisible 
                      ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 border border-yellow-200' 
                      : 'text-slate-400 hover:text-yellow-700 hover:bg-yellow-50'
                  }`}
                  title={notesVisible ? "Ocultar Notas" : "Exibir Notas"}
              >
                  {notesVisible ? <EyeOff className="w-4 h-4" /> : <StickyNote className="w-4 h-4" />}
              </Button>

              <Button 
                  onClick={onSave}
                  disabled={isSaving || !hasChanges}
                  size="sm"
                  className={`h-8 px-4 transition-all duration-300 rounded-md ml-2 ${
                      hasChanges 
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-100' 
                      : 'bg-transparent text-green-600 hover:bg-green-50 border border-transparent'
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
                border-top: 1px solid #f1f5f9 !important;
                border-bottom: 1px solid #f1f5f9 !important;
                padding: 8px 24px !important;
                background-color: #fcfcfc;
            }
            .ql-toolbar button {
                color: #64748b; 
            }
            .ql-toolbar button:hover {
                color: #0f172a;
            }
            .ql-toolbar .ql-active {
                color: #dc2626 !important;
            }
            .ql-editor {
                font-family: 'Inter', sans-serif;
                font-size: 1.05rem;
                line-height: 1.65;
                padding: 30px 40px !important;
                height: 100%;
                overflow-y: auto;
                color: #1e293b;
            }
            .ql-editor h1 { font-size: 1.75rem; font-weight: 800; margin: 1.25rem 0 0.75rem 0; color: #0f172a; }
            .ql-editor h2 { font-size: 1.4rem; font-weight: 700; margin: 1.15rem 0 0.6rem 0; color: #1e293b; }
            .ql-editor h3 { font-size: 1.2rem; font-weight: 600; margin: 1rem 0 0.5rem 0; color: #334155; }
            .ql-editor p { margin: 0.35rem 0; }
            .ql-editor blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; margin: 0.75rem 0; color: #64748b; font-style: italic; }
            `}</style>
            
            <div className="flex-1 flex flex-col min-h-0">
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={displayContent}
                    onChange={(val) => onChange(sectionKey, val)}
                    onChangeSelection={handleSelectionChange}
                    placeholder={`Escreva aqui o seu roteiro incrível...`}
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