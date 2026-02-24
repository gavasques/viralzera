import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Trash2, CheckCircle } from "lucide-react";
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
} from "@/components/ui/alert-dialog";

export default function VersionsTabs({ scriptId, currentVersionId, onVersionChange }) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [versionToDelete, setVersionToDelete] = React.useState(null);

  // Buscar versões de geração (tipo 'generation')
  const { data: versions = [] } = useQuery({
    queryKey: ['script-generation-versions', scriptId],
    queryFn: async () => {
      const allVersions = await neon.entities.YoutubeScriptVersion.filter({ 
        script_id: scriptId,
        change_type: 'generation'
      }, '-created_date');
      return allVersions;
    },
    enabled: !!scriptId
  });

  // Mutation para definir versão principal
  const setPrimaryMutation = useMutation({
    mutationFn: async (versionId) => {
      // 1. Desmarcar todas as versões como não-principal
      const updatePromises = versions.map(v => 
        neon.entities.YoutubeScriptVersion.update(v.id, { is_primary: false })
      );
      await Promise.all(updatePromises);

      // 2. Marcar a versão selecionada como principal
      await neon.entities.YoutubeScriptVersion.update(versionId, { is_primary: true });

      // 3. Atualizar o corpo do roteiro principal
      const selectedVersion = versions.find(v => v.id === versionId);
      if (selectedVersion) {
        await neon.entities.YoutubeScript.update(scriptId, {
          corpo: selectedVersion.corpo
        });
      }

      return selectedVersion;
    },
    onSuccess: (selectedVersion) => {
      queryClient.invalidateQueries({ queryKey: ['script-generation-versions', scriptId] });
      queryClient.invalidateQueries({ queryKey: ['youtube-script', scriptId] });
      onVersionChange(selectedVersion);
      toast.success('Versão principal atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao definir versão principal: ' + error.message);
    }
  });

  // Mutation para excluir versão
  const deleteMutation = useMutation({
    mutationFn: async (versionId) => {
      const versionToDelete = versions.find(v => v.id === versionId);
      
      // Não permitir excluir se for a última versão
      if (versions.length === 1) {
        throw new Error('Não é possível excluir a única versão disponível');
      }

      // Se estiver excluindo a versão principal, definir outra como principal
      if (versionToDelete.is_primary) {
        const otherVersion = versions.find(v => v.id !== versionId);
        if (otherVersion) {
          await neon.entities.YoutubeScriptVersion.update(otherVersion.id, { is_primary: true });
          await neon.entities.YoutubeScript.update(scriptId, {
            corpo: otherVersion.corpo
          });
        }
      }

      // Excluir a versão
      await neon.entities.YoutubeScriptVersion.delete(versionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-generation-versions', scriptId] });
      queryClient.invalidateQueries({ queryKey: ['youtube-script', scriptId] });
      toast.success('Versão excluída!');
      setDeleteDialogOpen(false);
      setVersionToDelete(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir versão: ' + error.message);
    }
  });

  const handleDeleteClick = (version) => {
    setVersionToDelete(version);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (versionToDelete) {
      deleteMutation.mutate(versionToDelete.id);
    }
  };

  if (versions.length === 0) return null;

  const primaryVersion = versions.find(v => v.is_primary);

  return (
    <>
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Versões Geradas:</span>
            <div className="flex items-center gap-2">
              {versions.map((version) => (
                <div key={version.id} className="flex items-center gap-1 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
                  <button
                    onClick={() => onVersionChange(version)}
                    className={`text-sm font-medium transition-colors ${
                      currentVersionId === version.id 
                        ? 'text-red-600' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {version.model_name}
                  </button>
                  
                  {version.is_primary && (
                    <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1.5 bg-yellow-50 border-yellow-300 text-yellow-700">
                      <Star className="w-2.5 h-2.5 mr-0.5 fill-yellow-500" />
                      Principal
                    </Badge>
                  )}

                  {currentVersionId === version.id && (
                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                      {!version.is_primary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPrimaryMutation.mutate(version.id)}
                          disabled={setPrimaryMutation.isPending}
                          className="h-6 px-2 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Definir como Principal
                        </Button>
                      )}
                      {versions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(version)}
                          disabled={deleteMutation.isPending}
                          className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir versão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a versão "{versionToDelete?.model_name}"? Esta ação não pode ser desfeita.
              {versionToDelete?.is_primary && (
                <span className="block mt-2 text-amber-600 font-medium">
                  ⚠️ Esta é a versão principal. Ao excluí-la, outra versão será definida como principal automaticamente.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}