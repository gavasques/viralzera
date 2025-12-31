import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Replace, ArrowDownToLine, Check } from "lucide-react";
import { toast } from "sonner";

export default function RefinerSuggestionCard({ 
  index, 
  suggestion, 
  onReplace, 
  onInsertBelow 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestion);
      setCopied(true);
      toast.success('Copiado para a área de transferência');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge variant="secondary" className="text-xs">
            Opção {index + 1}
          </Badge>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mb-4 max-h-64 overflow-y-auto">
          {suggestion}
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onInsertBelow}
            className="flex-1 gap-2"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Inserir Abaixo
          </Button>
          <Button
            size="sm"
            onClick={onReplace}
            className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Replace className="w-4 h-4" />
            Substituir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}