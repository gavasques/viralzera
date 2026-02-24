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
  onGenerateDescription,
  onHistoryOpen,
  onNavigateBack,
  onSendToKanban,
  isSendingToKanban
}) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-4">
      <div className="max-w-[1600px] mx-auto flex items-start justify-between gap-6">
        
        {/* Left Column: Navigation & Inputs */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onNavigateBack}
            className="shrink-0 text-slate-400 hover:text-slate-600 mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex flex-col gap-2 w-full max-w-3xl">
            {/* Title Input */}
            <div className="flex items-center gap-4">
              <div className="h-8 w-px bg-slate-200 shrink-0 hidden md:block" />
              <Input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-xl font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-1 hover:bg-slate-50 rounded transition-colors text-slate-800 placeholder:text-slate-300 w-full"
                placeholder="Sem título..."
              />
            </div>
            
            {/* Status & Category Selects */}
            <div className="flex items-center gap-2 pl-0 md:pl-4">
              <Select value={status || "Rascunho"} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[180px] h-8 bg-slate-50 border-transparent hover:bg-slate-100 transition-colors text-xs font-medium rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Roteiro Pronto">Roteiro Pronto</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoria || "Genérico"} onValueChange={onCategoriaChange}>
                <SelectTrigger className="w-[220px] h-8 bg-slate-50 border-transparent hover:bg-slate-100 transition-colors text-xs font-medium rounded-lg">
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

        {/* Right Column: Actions */}
        <div className="flex items-center gap-3 shrink-0 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSuggestTitles}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-9 px-3 gap-2 font-medium"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">Sugerir Títulos</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onHistoryOpen}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 h-9 px-3 gap-2 font-medium"
          >
            <History className="w-4 h-4" />
            <span className="text-xs">Histórico</span>
          </Button>
          
          <div className="h-6 w-px bg-slate-200 mx-2" />

          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateDescription}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-9 gap-2 shadow-sm rounded-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-xs">Gerar Descrição</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onSendToKanban}
            disabled={isSendingToKanban}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 gap-2 shadow-sm rounded-lg ml-1"
          >
            {isSendingToKanban ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layout className="w-4 h-4" />}
            <span className="font-semibold text-xs">Enviar p/ Kanban</span>
          </Button>
        </div>
      </div>
    </div>
  );
}