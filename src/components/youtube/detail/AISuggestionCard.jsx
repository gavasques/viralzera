import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Replace, Plus } from "lucide-react";

export default function AISuggestionCard({ title, content, onCopy, onReplace, onInsertBelow }) {
  return (
    <Card className="border-slate-200 hover:border-purple-200 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
          {content}
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCopy}
            className="gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReplace}
            className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Replace className="w-3.5 h-3.5" />
            Substituir
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onInsertBelow}
            className="gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Inserir Abaixo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}