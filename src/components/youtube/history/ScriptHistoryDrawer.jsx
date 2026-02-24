import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Clock, RotateCcw, ChevronRight, User, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ScriptHistoryDrawer({ 
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
    enabled: open && !!scriptId,
  });

  const handleRestore = async (version) => {
    try {
      await onRestore(version);
      onOpenChange(false);
      toast.success("Versão restaurada com sucesso!");
    } catch (error) {
      toast.error("Erro ao restaurar versão: " + error.message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:max-w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 border-b bg-slate-50/50">
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            Histórico de Versões
          </SheetTitle>
          <SheetDescription>
            Visualize e restaure versões anteriores deste roteiro.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Clock className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <History className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p>Nenhuma versão anterior encontrada.</p>
              <p className="text-xs mt-1">As versões são criadas automaticamente ao salvar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => {
                const isManual = version.change_type === 'manual' || !version.change_type;
                const isAuto = version.change_type === 'auto';
                const isRestore = version.change_type === 'restore';
                
                return (
                <div 
                  key={version.id} 
                  className={`group flex flex-col gap-3 p-4 rounded-xl border transition-all bg-white ${
                    isManual 
                      ? 'border-green-200 hover:border-green-300 hover:shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs font-normal bg-slate-50 text-slate-600 border-slate-200 shrink-0">
                          {versions.length - index}
                        </Badge>
                        <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                          {format(new Date(version.created_date), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {isManual && (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200 gap-1 shrink-0">
                            <User className="w-3 h-3" />
                            USUÁRIO
                          </Badge>
                        )}
                        {isAuto && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 gap-1 shrink-0">
                            <Zap className="w-3 h-3" />
                            Auto Save
                          </Badge>
                        )}
                        {isRestore && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200 gap-1 shrink-0">
                            <RotateCcw className="w-3 h-3" />
                            Backup
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 pl-8">
                        {version.change_description || "Alteração salva"}
                      </p>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restaurar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restaurar esta versão?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso substituirá o conteúdo atual pelo conteúdo desta versão salva em {format(new Date(version.created_date), "dd/MM/yyyy HH:mm")}.
                            <br/><br/>
                            <strong>Nota:</strong> Uma nova versão do estado ATUAL será salva antes da restauração, para segurança.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleRestore(version)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Sim, Restaurar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="pl-8 mt-1">
                     <p className="text-xs text-slate-400 break-words leading-relaxed">
                        {version.title}
                     </p>
                  </div>
                </div>
              )})}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}