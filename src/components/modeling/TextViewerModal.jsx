import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check, Hash, FileText, Download } from "lucide-react";

export default function TextViewerModal({ open, onOpenChange, text }) {
  const [copied, setCopied] = useState(false);

  if (!text) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(text.content || '');
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text.content || ''], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${text.title || 'texto'}.txt`;
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
            <FileText className="w-5 h-5 text-blue-600" />
            {text.title || 'Sem título'}
          </DialogTitle>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline">{text.text_type || 'Texto'}</Badge>
            {text.description && (
              <p className="text-sm text-slate-500 truncate max-w-[500px]">{text.description}</p>
            )}
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              {(text.character_count || 0).toLocaleString()} caracteres
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Hash className="w-3 h-3 mr-1" />
              ~{(text.token_estimate || 0).toLocaleString()} tokens
            </Badge>
          </div>
          <div className="flex gap-2">
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
              Baixar
            </Button>
          </div>
        </div>

        <div className="flex-1 mt-2 overflow-y-auto">
          <div className="pr-4">
            {text.content ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">
                {text.content}
              </p>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum conteúdo disponível</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}