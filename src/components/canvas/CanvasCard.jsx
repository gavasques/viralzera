import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Pin, 
  PinOff, 
  MoreHorizontal, 
  ArrowUpRight, 
  Copy, 
  Trash2, 
  Clock, 
  Sparkles,
  Folder
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CanvasCard({ 
  canvas, 
  folderName,
  onClick, 
  onSendToKanban, 
  onCopy, 
  onTogglePin, 
  onDelete 
}) {
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-100 hover:border-pink-200 bg-white relative overflow-hidden"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-pink-50/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <CardContent className="p-5 flex flex-col h-full relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {canvas.is_pinned && (
                <Pin className="w-3.5 h-3.5 text-pink-500 shrink-0 fill-current" />
              )}
              <h3 className="font-semibold text-slate-900 truncate text-base leading-tight">
                {canvas.title || "Sem título"}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {folderName && (
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0 h-5 font-medium bg-indigo-50 text-indigo-700"
                >
                  <Folder className="w-2.5 h-2.5 mr-1" />
                  {folderName}
                </Badge>
              )}
              {canvas.source === 'script_generator' && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-indigo-200 text-indigo-600 bg-indigo-50">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  AI
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSendToKanban(canvas); }}>
                <ArrowUpRight className="w-4 h-4 mr-2 text-indigo-500" />
                Enviar ao Kanban
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(canvas.content, canvas.id); }}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar conteúdo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(canvas); }}>
                {canvas.is_pinned ? (
                  <><PinOff className="w-4 h-4 mr-2" /> Desafixar</>
                ) : (
                  <><Pin className="w-4 h-4 mr-2" /> Fixar no topo</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(canvas.id); }}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content Preview */}
        <div className="flex-1 mb-4">
          <p className="text-sm text-slate-500 line-clamp-4 leading-relaxed">
            {canvas.content || <span className="italic opacity-50">Sem conteúdo...</span>}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
          <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500 font-normal hover:bg-slate-200 transition-colors">
            {canvas.content?.length?.toLocaleString() || 0} chars
          </Badge>
          
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" />
            {format(new Date(canvas.created_date), "dd MMM", { locale: ptBR })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}