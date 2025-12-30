import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CanvasHistoryPanel({ history = [], onRestore }) {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
        <History className="w-8 h-8 mb-3 opacity-50" />
        <p className="text-sm">Nenhum histórico de edições encontrado.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {history.map((version, index) => (
          <div key={version.id} className="relative pl-6 border-l-2 border-slate-100 last:border-0 pb-6 last:pb-0">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-200" />
            
            <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">
                  Versão {history.length - index}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(version.created_date), "dd/MM/yy HH:mm", { locale: ptBR })}
                </span>
              </div>
              
              <p className="text-xs text-slate-500 line-clamp-3 mb-3 font-mono bg-white p-2 rounded border border-slate-100">
                {version.content}
              </p>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-7 text-xs gap-2"
                onClick={() => onRestore(version)}
              >
                <RotateCcw className="w-3 h-3" />
                Restaurar esta versão
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}