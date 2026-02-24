import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Check, Hash, FileText, ExternalLink, Download } from "lucide-react";

export default function LinkViewerModal({ open, onOpenChange, link, analysis }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  if (!link) return null;

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content || '');
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content, filename) => {
    const blob = new Blob([content || ''], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Download concluído!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            Conteúdo do Link
          </DialogTitle>
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{link.title || 'Sem título'}</p>
              <p className="text-xs text-slate-500 truncate">{link.url}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(link.url, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Abrir
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="content">Conteúdo Completo</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="flex-1 flex flex-col min-h-0 mt-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  {(analysis?.character_count || 0).toLocaleString()} caracteres
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Hash className="w-3 h-3 mr-1" />
                  ~{(analysis?.token_estimate || 0).toLocaleString()} tokens
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleCopy(analysis?.analysis_summary)}>
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
                <Button variant="outline" size="sm" onClick={() => handleDownload(analysis?.analysis_summary, `${link.title || 'analise'}.txt`)}>
                  <Download className="w-3 h-3 mr-1" />
                  Baixar
                </Button>
              </div>
            </div>

            <div className="flex-1 mt-2 overflow-y-auto">
              <div className="pr-4">
                {analysis?.analysis_summary ? (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {analysis.analysis_summary}
                  </p>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma análise disponível</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="flex-1 flex flex-col min-h-0 mt-3">
            <div className="flex items-center justify-end py-2 border-b border-slate-100 shrink-0">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleCopy(link.content)}>
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
                <Button variant="outline" size="sm" onClick={() => handleDownload(link.content, `${link.title || 'conteudo'}.txt`)}>
                  <Download className="w-3 h-3 mr-1" />
                  Baixar
                </Button>
              </div>
            </div>

            <div className="flex-1 mt-2 overflow-y-auto">
              <div className="pr-4">
                {link.content ? (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">
                    {link.content}
                  </p>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum conteúdo disponível</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}