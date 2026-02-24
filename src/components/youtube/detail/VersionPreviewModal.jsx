import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export default function VersionPreviewModal({ open, onOpenChange, version, onSetPrimary, isPending }) {
  if (!version) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">{version.title}</DialogTitle>
            {version.is_primary && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <Check className="w-3 h-3 mr-1" />
                Principal
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Gerado por: {version.model_name || 'IA'}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-white rounded-lg p-8 border border-slate-200">
          <div 
            className="text-slate-900 leading-relaxed"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '15px',
              lineHeight: '1.7'
            }}
            dangerouslySetInnerHTML={{
              __html: version.corpo
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                .replace(/^#{1,6}\s+(.+)$/gm, (match, title) => {
                  const level = match.match(/^#{1,6}/)[0].length;
                  return `<h${level} style="font-size: ${20 - level}px; font-weight: bold; margin: 24px 0 12px 0; color: #1e293b;">${title}</h${level}>`;
                })
                .replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />')
                .replace(/\n\n/g, '</p><p style="margin: 16px 0;">')
                .replace(/^(.+)$/gm, (match) => {
                  if (match.startsWith('<') || !match.trim()) return match;
                  return `<p style="margin: 12px 0;">${match}</p>`;
                })
            }}
          />
        </div>

        {!version.is_primary && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                onSetPrimary();
                onOpenChange(false);
              }}
              disabled={isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Definir como Principal
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}