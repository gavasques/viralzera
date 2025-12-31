import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Copy, Check, Hash, FileText, Edit2, Save, X, Download, 
  Sparkles, Layers, Calendar 
} from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function DossierViewerModal({ open, onOpenChange, dossier }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (newContent) => {
      return await base44.entities.ContentDossier.update(dossier.id, {
        full_content: newContent,
        character_count: newContent.length,
        token_estimate: Math.ceil(newContent.length / 4)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      setIsEditing(false);
      toast.success('Dossiê atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  if (!dossier) return null;

  const handleEdit = () => {
    setEditedContent(dossier.full_content);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editedContent);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(dossier.full_content);
    setCopied(true);
    toast.success('Dossiê copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([dossier.full_content], { type: 'text/markdown;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dossier.modeling?.title || 'dossie'}.md`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Dossiê baixado!');
  };

  const handleUseForScript = () => {
    window.location.href = `/YoutubeScripts?action=new&dossierId=${dossier.id}`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            {dossier.modeling?.title || 'Dossiê de Conteúdo'}
          </DialogTitle>
          <div className="flex items-center gap-2 flex-wrap pt-2">
            {dossier.modeling?.target_platform && (
              <Badge variant="outline">{dossier.modeling.target_platform}</Badge>
            )}
            {dossier.modeling?.content_type && (
              <Badge variant="outline" className="bg-slate-50">
                {dossier.modeling.content_type}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {format(new Date(dossier.created_date), 'dd/MM/yyyy HH:mm')}
            </Badge>
          </div>
        </DialogHeader>

        {/* Stats Bar */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500">
              <Hash className="w-3 h-3 inline mr-1" />
              {formatNumber(dossier.character_count)} caracteres
            </div>
            <div className="text-xs text-slate-500">
              <Layers className="w-3 h-3 inline mr-1" />
              ~{formatNumber(dossier.token_estimate)} tokens
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-3 h-3 mr-1" />
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-3 h-3 mr-1" />
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-3 h-3 mr-1" />
                  Baixar MD
                </Button>
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={handleUseForScript}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Usar para Roteiro
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-[600px]">
          <div className="pr-6 py-4">
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Edite o conteúdo do dossiê em Markdown..."
              />
            ) : (
              <div className="prose prose-slate max-w-none
                prose-headings:font-bold prose-headings:text-slate-900
                prose-h1:text-3xl prose-h1:mb-4 prose-h1:pb-3 prose-h1:border-b prose-h1:border-slate-200
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-purple-700
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-slate-800
                prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
                prose-strong:text-slate-900 prose-strong:font-semibold
                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                prose-li:text-slate-700 prose-li:my-2
                prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600
                prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                prose-hr:border-slate-200 prose-hr:my-8
                prose-img:rounded-lg prose-img:shadow-md"
              >
                <ReactMarkdown>{dossier.full_content}</ReactMarkdown>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}