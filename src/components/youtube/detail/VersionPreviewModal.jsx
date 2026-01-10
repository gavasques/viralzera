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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl">{version.title}</DialogTitle>
              {version.is_primary && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  Principal
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Gerado por: {version.model_name || 'IA'}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg p-6 border border-slate-200">
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
              {version.corpo}
            </div>
          </div>
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