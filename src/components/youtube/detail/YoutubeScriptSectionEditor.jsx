import React, { useMemo, useRef, useState, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Custom Blot for Notes
const Inline = Quill.import('blots/inline');
class NoteBlot extends Inline {
  static create(value) {
    let node = super.create();
    node.setAttribute('class', 'script-note-highlight');
    node.setAttribute('data-note-id', value);
    return node;
  }

  static formats(node) {
    return node.getAttribute('data-note-id');
  }
}
NoteBlot.blotName = 'note';
NoteBlot.tagName = 'span';
NoteBlot.className = 'script-note-highlight';
Quill.register(NoteBlot);
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
import ScriptNoteViewerPopover from "./ScriptNoteViewerPopover";

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

// Basic Markdown to HTML converter - preserves existing HTML including note spans
const markdownToHtml = (text) => {
  if (!text) return '';
  
  // Check if it looks like HTML already (preserve it as-is to keep note spans)
  if (/<[a-z][\s\S]*>/i.test(text)) {
    console.log('Content is already HTML, preserving as-is');
    return text;
  }

  console.log('Converting markdown to HTML');
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
  onAddNote, // Function to notify parent about new note creation
  onNoteSelect, // Function to notify parent about note selection
  activeNoteId, // Currently active note ID for highlighting
  scriptId // Required for fetching note details
}) {
  console.log('🟢 ScriptSectionEditor mounted, scriptId:', scriptId);
  
  const quillRef = useRef(null);
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState(null);
  const [viewingNote, setViewingNote] = useState(null); // { id, position, data }
  const editorRef = useRef(null);

  // Fetch notes to display content in popover (deduped with ScriptNotesPanel)
  const { data: notes = [] } = useQuery({
    queryKey: ['script-notes', scriptId],
    queryFn: async () => {
      console.log('🔍 Fetching notes for script:', scriptId);
      const result = await base44.entities.ScriptNote.filter({ script_id: scriptId });
      console.log('🔍 Fetched notes:', result);
      return result;
    },
    enabled: !!scriptId
  });

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScriptNote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-notes', scriptId] });
      setViewingNote(null);
      toast.success('Nota removida');
    },
    onError: (err) => {
        toast.error('Erro ao remover nota: ' + err.message);
    }
  });

  // Custom styles for notes
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .script-note-highlight {
        background-color: #fef08a; /* yellow-200 */
        cursor: pointer;
        border-bottom: 2px solid #eab308; /* yellow-500 */
        transition: background-color 0.2s;
      }
      .script-note-highlight:hover {
        background-color: #fde047; /* yellow-300 */
      }
      .script-note-highlight[data-active="true"] {
        background-color: #fcd34d; /* yellow-400 */
        border-bottom-color: #ca8a04; /* yellow-600 */
      }
      /* Hide notes when toggled off */
      .hide-notes .script-note-highlight {
        background-color: transparent !important;
        border-bottom: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Update active status of notes
  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();
    const root = editor.root;
    
    // Reset all
    const notes = root.querySelectorAll('.script-note-highlight');
    notes.forEach(node => node.removeAttribute('data-active'));

    // Set active
    if (activeNoteId) {
      const activeNode = root.querySelector(`.script-note-highlight[data-note-id="${activeNoteId}"]`);
      if (activeNode) {
        activeNode.setAttribute('data-active', 'true');
        // Optional: Scroll to view?
        // activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeNoteId, content]);

  // Handle note clicks
  useEffect(() => {
    const handleClick = (e) => {
      console.log('Click detected, target:', e.target, 'classList:', e.target.classList);
      
      const target = e.target;
      if (target.classList.contains('script-note-highlight')) {
        const noteId = target.getAttribute('data-note-id');
        
        console.log('✅ Note clicked, noteId:', noteId);
        console.log('Available notes:', notes);
        
        // Find note data by data_id
        console.log('🔎 Looking for noteId:', noteId);
        console.log('🔎 Notes in array (FULL):', JSON.stringify(notes.map(n => ({ id: n.id, data_id: n.data_id, quote: n.quote, note: n.note }))));
        
        const noteData = notes.find(n => n.data_id === noteId);
        console.log('🔎 Found note by data_id:', noteData);
        
        // If not found by data_id, try by id (for backwards compatibility)
        const noteFallback = !noteData ? notes.find(n => n.id === noteId) : null;
        console.log('🔎 Found note by id (fallback):', noteFallback);
        
        const finalNoteData = noteData || noteFallback;
        console.log('🔎 Final note data:', finalNoteData);
        
        if (finalNoteData) {
            // Notify parent to highlight in sidebar
            if (noteId && onNoteSelect) {
              console.log('Calling onNoteSelect with:', noteId);
              onNoteSelect(noteId);
            }

            // Show popover
            const rect = target.getBoundingClientRect();
            setViewingNote({
                id: noteId,
                data: finalNoteData,
                position: {
                    x: rect.left + (rect.width / 2),
                    y: rect.top,
                    bottom: rect.bottom
                }
            });
            // Clear text selection if any, to avoid overlapping popovers
            setSelection(null);
        } else {
            console.warn('❌ Note not found for noteId:', noteId, 'in notes:', notes);
        }
      }
    };

    const editorContainer = document.querySelector('.ql-editor');
    if (editorContainer) {
      console.log('Adding click handler to editor');
      editorContainer.addEventListener('click', handleClick);
    } else {
      console.warn('Editor container not found');
    }

    return () => {
      if (editorContainer) {
        editorContainer.removeEventListener('click', handleClick);
      }
    };
  }, [onNoteSelect, notes]);

  const handleAddNoteInternal = (selectedText) => {
    if (quillRef.current && selection) {
      const editor = quillRef.current.getEditor();
      const noteId = crypto.randomUUID();
      
      console.log('🟡 Creating note with ID:', noteId, 'for text:', selectedText);
      
      // Apply format
      editor.formatText(selection.range.index, selection.range.length, 'note', noteId);
      
      // Get updated HTML and log it
      const newHtml = editor.root.innerHTML;
      console.log('🟡 New HTML after formatting:', newHtml.substring(0, 500));
      
      // Force content update to persist the HTML
      onChange(sectionKey, newHtml);
      
      // Notify parent
      if (onAddNote) {
        onAddNote(noteId, selectedText);
      }
      
      setSelection(null);
    }
  };

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
    const converted = markdownToHtml(content);
    console.log('📄 Display content (first 300 chars):', converted?.substring(0, 300));
    return converted;
  }, [content]);

  // Debug: log notes when they change
  useEffect(() => {
    console.log('📝 Notes updated:', notes);
  }, [notes]);

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
                font-size: 1.125rem;
                line-height: 1.6;
                padding: 30px 40px !important;
                height: 100%;
                overflow-y: auto;
                color: #1e293b;
            }
            .ql-editor h1 { font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: #0f172a; }
            .ql-editor h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1e293b; }
            .ql-editor h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #334155; }
            .ql-editor p { margin-bottom: 0.75rem; }
            .ql-editor blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; color: #64748b; font-style: italic; }
            `}</style>
            
            <div className="flex-1 flex flex-col min-h-0">
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={displayContent}
                    onChange={(val) => onChange(sectionKey, val)}
                    onChangeSelection={handleSelectionChange}
                    placeholder={`Escreva aqui o seu roteiro incrível...`}
                    className={`flex-1 flex flex-col min-h-0 ${!notesVisible ? 'hide-notes' : ''}`}
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
            onAddNote={handleAddNoteInternal}
            fullContent={content}
            scriptTitle={scriptTitle}
            />

            <ScriptNoteViewerPopover 
                note={viewingNote?.data}
                position={viewingNote?.position}
                onClose={() => setViewingNote(null)}
                onDelete={(id) => deleteMutation.mutate(id)}
            />
        </div>
    </div>
  );
}