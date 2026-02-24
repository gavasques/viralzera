import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Send, Loader2, Paperclip, X, FileText, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { neon } from "@/api/neonClient";

/**
 * Componente unificado de input para chat
 * 
 * Props:
 * - onSend: Callback ao enviar mensagem (message, files)
 * - isLoading: Estado de carregamento
 * - placeholder: Placeholder do input
 * - enableFileUpload: Habilitar upload de arquivos
 * - acceptedFileTypes: Tipos de arquivos aceitos
 * - maxFiles: Máximo de arquivos
 * - disabled: Desabilitar input
 */
export default function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)",
  enableFileUpload = true,
  acceptedFileTypes = "image/*,.pdf,.txt,.md",
  maxFiles = 5,
  disabled = false,
}) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSend = () => {
    if ((!message.trim() && files.length === 0) || isLoading || uploading) return;
    
    onSend(message.trim(), files);
    setMessage('');
    setFiles([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivos`);
      return;
    }

    setUploading(true);

    try {
      const uploadedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          // Upload do arquivo
          const { file_url } = await neon.integrations.Core.UploadFile({ file });
          
          // Para imagens, retorna URL diretamente
          if (file.type.startsWith('image/')) {
            return {
              name: file.name,
              type: file.type,
              url: file_url,
              size: file.size,
            };
          }
          
          // Para PDFs e textos, tenta extrair conteúdo
          if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
            try {
              const extracted = await neon.integrations.Core.ExtractDataFromUploadedFile({
                file_url,
                json_schema: {
                  type: "object",
                  properties: {
                    content: { type: "string", description: "Conteúdo completo do arquivo" }
                  }
                }
              });
              
              return {
                name: file.name,
                type: file.type,
                url: file_url,
                content: extracted.output?.content || '',
                size: file.size,
              };
            } catch {
              return {
                name: file.name,
                type: file.type,
                url: file_url,
                size: file.size,
              };
            }
          }

          return {
            name: file.name,
            type: file.type,
            url: file_url,
            size: file.size,
          };
        })
      );

      setFiles(prev => [...prev, ...uploadedFiles]);
      toast.success(`${uploadedFiles.length} arquivo(s) anexado(s)`);
    } catch (error) {
      toast.error('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Arquivos anexados */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="pl-2 pr-1 py-1 bg-slate-100 text-slate-700 flex items-center gap-1.5"
              >
                {getFileIcon(file.type)}
                <span className="max-w-[150px] truncate">{file.name}</span>
                <span className="text-xs text-slate-400">({formatFileSize(file.size)})</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-slate-200 rounded-full ml-1"
                  onClick={() => removeFile(idx)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="flex gap-2 items-end">
          {enableFileUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFileTypes}
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || uploading || disabled}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
          
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            rows={1}
            disabled={isLoading || disabled}
          />
          
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && files.length === 0) || isLoading || uploading || disabled}
            className="bg-indigo-600 hover:bg-indigo-700 h-11 px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}