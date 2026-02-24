import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check, Hash, FileText, ExternalLink, Download } from "lucide-react";

export default function TranscriptViewerModal({ open, onOpenChange, video }) {
  const [copied, setCopied] = useState(false);

  if (!video) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(video.content || '');
    setCopied(true);
    toast.success('Transcrição copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([video.content || ''], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video.title || 'transcricao'}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Transcrição baixada!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-pink-600" />
            Transcrição
          </DialogTitle>
          <div className="flex items-center gap-2 flex-wrap pt-2">
            {video.thumbnail_url && (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-16 h-10 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{video.title}</p>
              {video.channel_name && (
                <p className="text-xs text-slate-500">{video.channel_name}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(video.url, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              YouTube
            </Button>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              {(video.character_count || 0).toLocaleString()} caracteres
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Hash className="w-3 h-3 mr-1" />
              ~{(video.token_estimate || 0).toLocaleString()} tokens
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
              Baixar TXT
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 mt-2">
          <div className="pr-4">
            {video.content ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">
                {video.content}
              </p>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma transcrição disponível</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}