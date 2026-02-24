import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import {
  Copy, Check, Hash, FileText, Edit2, Save, X, Download,
  Sparkles, Layers, Calendar, Database, Eye, Terminal
} from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function DossierViewerModal({ open, onOpenChange, dossier }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [activeTab, setActiveTab] = useState("analysis");

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (newContent) => {
      return await neon.entities.ContentDossier.update(dossier.id, {
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
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50">
        <DialogHeader className="shrink-0 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <FileText className="w-5 h-5 text-purple-600" />
                {dossier.modeling?.title || 'Dossiê de Conteúdo'}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {dossier.created_at ? format(new Date(dossier.created_at), "dd 'de' MMMM, HH:mm") : '—'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  {formatNumber(dossier.character_count)} caracteres
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  ~{formatNumber(dossier.token_estimate)} tokens
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {dossier.modeling?.target_platform && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-normal">
                  {dossier.modeling.target_platform}
                </Badge>
              )}
              {dossier.modeling?.content_type && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-normal">
                  {dossier.modeling.content_type}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between sticky top-0 z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-slate-100 p-0.5 h-9">
              <TabsTrigger value="analysis" className="text-xs h-8 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Análise Gerada (Retorno)
              </TabsTrigger>
              <TabsTrigger value="input" className="text-xs h-8 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Database className="w-3.5 h-3.5 mr-2" />
                Dados Enviados (Dossiê + Prompt)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            {isEditing && activeTab === 'analysis' ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8">
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="h-8 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </>
            ) : (
              <>
                {activeTab === 'analysis' && (
                  <Button variant="ghost" size="sm" onClick={handleEdit} className="h-8 text-slate-600">
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                  </Button>
                )}
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 text-slate-600">
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8 text-slate-600">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Baixar
                </Button>
                <Button
                  size="sm"
                  className="h-8 ml-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm"
                  onClick={handleUseForScript}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Gerar Roteiro
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-50">
          <ScrollArea className="h-full w-full">
            <div className="max-w-4xl mx-auto my-8">
              {activeTab === 'analysis' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[800px] p-8 md:p-12 transition-all overflow-hidden">
                  <style>{`
                    .dossier-content * {
                      white-space: normal !important;
                      word-wrap: break-word !important;
                      overflow-wrap: break-word !important;
                    }
                    .dossier-content pre,
                    .dossier-content code {
                      white-space: pre-wrap !important;
                    }
                  `}</style>
                  {isEditing ? (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-[700px] w-full border-0 focus-visible:ring-0 p-0 resize-none font-mono text-sm leading-relaxed text-slate-700"
                      placeholder="Edite o conteúdo do dossiê em Markdown..."
                    />
                  ) : (
                    <div className="dossier-content">
                      <article className="prose prose-slate max-w-none
                        prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 
                        prose-h1:text-3xl prose-h1:pb-6 prose-h1:mb-8 prose-h1:border-b prose-h1:border-slate-100
                        prose-h2:text-xl prose-h2:text-purple-700 prose-h2:mt-12 prose-h2:mb-6
                        prose-h3:text-lg prose-h3:font-semibold prose-h3:text-slate-800 prose-h3:mt-8 prose-h3:mb-4
                        prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-base prose-p:mb-6
                        prose-strong:text-slate-900 prose-strong:font-semibold
                        prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
                        prose-li:text-slate-600 prose-li:my-2
                        prose-blockquote:border-l-4 prose-blockquote:border-purple-200 prose-blockquote:bg-purple-50/30 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:rounded-r-lg
                        prose-hr:my-10 prose-hr:border-slate-100
                        prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline
                        prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-medium before:prose-code:content-none after:prose-code:content-none"
                      >
                        <ReactMarkdown
                          components={{
                            h2: ({ node, ...props }) => <h2 {...props} className="group flex items-center"><span className="w-1.5 h-6 bg-purple-500 rounded-full mr-3 inline-block shrink-0"></span>{props.children}</h2>,
                            hr: () => <hr className="border-t-2 border-slate-100 my-10" />
                          }}
                        >
                          {dossier.full_content}
                        </ReactMarkdown>
                      </article>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Dados Enviados (Materiais) */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-600" />
                      <h3 className="font-semibold text-slate-900">Materiais Brutos Enviados</h3>
                    </div>
                    <div className="p-6 md:p-8">
                      {dossier.raw_materials ? (
                        <article className="prose prose-slate max-w-none text-sm w-full break-words
                          prose-headings:text-slate-800 prose-p:text-slate-600
                          prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-pre:text-slate-700"
                        >
                          <ReactMarkdown>{dossier.raw_materials}</ReactMarkdown>
                        </article>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>Nenhum material bruto salvo para este dossiê.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prompt do Sistema */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Prompt do Sistema</h3>
                    </div>
                    <div className="p-6 bg-slate-900 overflow-x-auto">
                      {dossier.system_prompt ? (
                        <pre className="text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                          {dossier.system_prompt}
                        </pre>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <Terminal className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>Nenhum prompt salvo para este dossiê.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="h-10" /> {/* Spacer */}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}