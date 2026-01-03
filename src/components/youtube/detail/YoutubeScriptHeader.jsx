import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Package, History } from "lucide-react";

export default function YoutubeScriptHeader({ 
  title, 
  onTitleChange, 
  onSuggestTitles,
  onGenerateKit,
  onHistoryOpen,
  onNavigateBack
}) {
  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 -mx-6 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Back button and title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onNavigateBack}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-xl font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-1"
            placeholder="Título do roteiro..."
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onSuggestTitles}
            className="shrink-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Sugerir Títulos
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onHistoryOpen}
            className="shrink-0 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          >
            <History className="w-4 h-4 mr-1" />
            Histórico
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateKit}
            className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Package className="w-4 h-4 mr-1" />
            Gerar Kit YouTube
          </Button>
        </div>
      </div>
    </div>
  );
}