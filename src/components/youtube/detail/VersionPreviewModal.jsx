import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

export default function VersionPreviewModal({ 
  open, 
  onOpenChange, 
  version, 
  isPrimary, 
  onSetPrimary,
  isSettingPrimary 
}) {
  if (!version) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {version.model_name || 'Versão'}
              {isPrimary && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  Principal
                </Badge>
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-slate-200 p-6">
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
              {version.corpo}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-slate-500">
            {version.corpo?.length || 0} caracteres
          </p>
          {!isPrimary && (
            <Button
              onClick={() => {
                onSetPrimary(version.id);
                onOpenChange(false);
              }}
              disabled={isSettingPrimary}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Definir como Principal
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}