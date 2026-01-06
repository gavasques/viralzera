import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Sparkles, Package, History, Layout, Loader2 } from "lucide-react";

export default function YoutubeScriptHeader({ 
  title,
  status,
  categoria,
  onTitleChange,
  onStatusChange,
  onCategoriaChange,
  onSuggestTitles,
  onGenerateKit,
  onHistoryOpen,
  onNavigateBack,
  onSendToKanban,
  isSendingToKanban
}) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-3">
      <div className="max-w-[1600px] mx-auto space-y-3">
        <div className="flex items-center justify-between gap-6">
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

            <Button
              variant="default"
              size="sm"
              onClick={onSendToKanban}
              disabled={isSendingToKanban}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 gap-2 shadow-sm ml-2"
            >
              {isSendingToKanban ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layout className="w-4 h-4" />}
              <span className="font-medium">Enviar p/ Kanban</span>
            </Button>
          </div>
        </div>

        {/* Status and Categoria Row */}
        <div className="flex gap-3">
          <Select value={status || "Rascunho"} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[200px] h-9 bg-white border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rascunho">Rascunho</SelectItem>
              <SelectItem value="Roteiro Pronto">Roteiro Pronto</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoria || "Genérico"} onValueChange={onCategoriaChange}>
            <SelectTrigger className="w-[250px] h-9 bg-white border-slate-200">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Amazon">Amazon</SelectItem>
              <SelectItem value="Importação">Importação</SelectItem>
              <SelectItem value="Ferramentas">Ferramentas</SelectItem>
              <SelectItem value="Gestão">Gestão</SelectItem>
              <SelectItem value="Dubai">Dubai</SelectItem>
              <SelectItem value="Marketplaces">Marketplaces</SelectItem>
              <SelectItem value="Economia">Economia</SelectItem>
              <SelectItem value="Genérico">Genérico</SelectItem>
              <SelectItem value="Inteligência Artificial">Inteligência Artificial</SelectItem>
              <SelectItem value="Parcerias">Parcerias</SelectItem>
              <SelectItem value="Aulas">Aulas</SelectItem>
              <SelectItem value="Política">Política</SelectItem>
              <SelectItem value="Mercado Livre">Mercado Livre</SelectItem>
              <SelectItem value="Shopee">Shopee</SelectItem>
              <SelectItem value="Tiktok Shop">Tiktok Shop</SelectItem>
              <SelectItem value="Afiliados">Afiliados</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}