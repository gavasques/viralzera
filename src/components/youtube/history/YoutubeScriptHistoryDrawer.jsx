import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Clock, RotateCcw, Calendar, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function YoutubeScriptHistoryDrawer({
  open,
  onOpenChange,
  scriptId,
  onRestore
}) {
  const queryClient = useQueryClient();

  // Fetch versions
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['script-versions', scriptId],
    queryFn: () => neon.entities.YoutubeScriptVersion.filter(
      { script_id: scriptId }, 
      '-created_date', 
      50 // Limit to last 50 versions
    ),
    enabled: !!scriptId && open,
  });

  const handleRestore = (version) => {
    if (confirm(`Tem certeza que deseja restaurar a versão de ${format(new Date(version.created_date), "dd/MM 'às' HH:mm")}? O conteúdo atual será substituído.`)) {
      onRestore(version);
      onOpenChange(false);
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'manual': return 'Salvamento Manual';
      case 'auto': return 'Auto-save';
      case 'restore': return 'Restauração';
      default: return 'Versão';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'manual': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'auto': return 'bg-slate-100 text-slate-700 hover:bg-slate-200';
      case 'restore': return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:max-w-[500px] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            Histórico de Versões
          </SheetTitle>
          <SheetDescription>
            Visualize e restaure versões anteriores deste roteiro.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <span className="text-slate-400 text-sm">Carregando histórico...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <History className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Nenhuma versão anterior</p>
                <p className="text-slate-400 text-xs max-w-[200px]">
                  As versões serão criadas automaticamente quando você salvar o roteiro.
                </p>
              </div>
            ) : (
              <div className="relative border-l border-slate-200 ml-3 space-y-6">
                {versions.map((version, index) => (
                  <div key={version.id} className="ml-6 relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white bg-slate-300 group-hover:bg-red-500 transition-colors" />
                    
                    <div className="flex flex-col gap-2 p-4 rounded-lg border border-slate-100 bg-white hover:border-red-100 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 h-5 ${getTypeColor(version.change_type)}`}>
                            {getTypeLabel(version.change_type)}
                          </Badge>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(version.created_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                            <Clock className="w-3 h-3 ml-1" />
                            {format(new Date(version.created_date), "HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5 hover:text-red-600 hover:border-red-200"
                          onClick={() => handleRestore(version)}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restaurar
                        </Button>
                      </div>

                      {version.title && (
                        <div className="text-sm font-medium text-slate-800 line-clamp-1">
                          {version.title}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {version.content ? version.content.length : 0} caracteres
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}