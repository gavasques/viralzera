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
    <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-3">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-6">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onNavigateBack}
            className="shrink-0 text-slate-400 hover:text-slate-600 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="h-6 w-px bg-slate-200 shrink-0" />
          
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-lg font-medium border-0 bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-1 hover:bg-slate-50 rounded transition-colors text-slate-700 placeholder:text-slate-300 w-full max-w-2xl"
            placeholder="Sem título..."
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
           <Button
            variant="ghost"
            size="sm"
            onClick={onSuggestTitles}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-9 px-3 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium">Sugerir Títulos</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onHistoryOpen}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 h-9 px-3 gap-2"
          >
            <History className="w-4 h-4" />
            <span className="text-xs font-medium">Histórico</span>
          </Button>
          
          <div className="h-4 w-px bg-slate-200 mx-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateKit}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-9 gap-2 shadow-sm"
          >
            <Package className="w-4 h-4" />
            <span className="font-medium">Gerar Kit YouTube</span>
          </Button>
        </div>
      </div>
    </div>
  );
}