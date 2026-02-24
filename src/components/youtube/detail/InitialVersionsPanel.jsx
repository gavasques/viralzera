import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sparkles, Trash2, Check, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import VersionPreviewModal from "./VersionPreviewModal";

export default function InitialVersionsPanel({ scriptId, onVersionSelected, currentContent }) {
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionToDelete, setVersionToDelete] = useState(null);
  const [previewVersion, setPreviewVersion] = useState(null);

  // Buscar apenas versões "initial" (geradas no wizard)
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['initial-versions', scriptId],
    queryFn: async () => {
      const all = await neon.entities.YoutubeScriptVersion.filter({ 
        script_id: scriptId,
        change_type: 'initial'
      }, '-created_date');
      return all;
    },
    enabled: !!scriptId
  });

  const primaryVersion = versions.find(v => v.is_primary);

  // Mutation para definir como principal
  const setPrimaryMutation = useMutation({
    mutationFn: async (versionId) => {
      // 1. Remover is_primary de todas as versões deste script
      const allVersions = await neon.entities.YoutubeScriptVersion.filter({ 
        script_id: scriptId,
        change_type: 'initial'
      });
      
      for (const v of allVersions) {
        await neon.entities.YoutubeScriptVersion.update(v.id, { is_primary: false });
      }

      // 2. Definir esta como principal
      await neon.entities.YoutubeScriptVersion.update(versionId, { is_primary: true });

      // 3. Atualizar o conteúdo do script principal
      const version = versions.find(v => v.id === versionId);
      if (version) {
        await neon.entities.YoutubeScript.update(scriptId, {
          corpo: version.corpo,
          title: version.title
        });
      }

      return version;
    },
    onSuccess: (version) => {
      queryClient.invalidateQueries({ queryKey: ['initial-versions', scriptId] });
      queryClient.invalidateQueries({ queryKey: ['youtube-script', scriptId] });
      onVersionSelected(version);
      toast.success(`${version.model_name} definido como principal`);
    },
    onError: (error) => {
      toast.error('Erro ao definir como principal: ' + error.message);
    }
  });

  // Mutation para deletar versão
  const deleteMutation = useMutation({
    mutationFn: async (versionId) => {
      await neon.entities.YoutubeScriptVersion.delete(versionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initial-versions', scriptId] });
      setVersionToDelete(null);
      toast.success('Versão excluída');
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + error.message);
      setVersionToDelete(null);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (versions.length <= 1) {
    return null; // Não mostrar se houver apenas 1 versão
  }

  return (
    <>
      <Card className="p-3 mb-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-purple-200/50">
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <div className="flex-1">
            <Tabs value={selectedVersion || primaryVersion?.id || versions[0]?.id} onValueChange={setSelectedVersion} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${versions.length}, 1fr)` }}>
                {versions.map((version) => (
                  <TabsTrigger 
                    key={version.id} 
                    value={version.id}
                    className="relative"
                  >
                    {version.model_name || 'Versão'}
                    {version.is_primary && (
                      <Check className="w-3 h-3 ml-1 text-green-600" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-3 space-y-2">
                {versions.map((version) => {
                  const isActive = (selectedVersion || primaryVersion?.id || versions[0]?.id) === version.id;
                  if (!isActive) return null;

                  return (
                    <div key={version.id}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {version.is_primary ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Principal
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setPrimaryMutation.mutate(version.id)}
                                disabled={setPrimaryMutation.isPending}
                                className="bg-purple-600 hover:bg-purple-700 h-7 text-xs"
                              >
                                {setPrimaryMutation.isPending ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3 mr-1" />
                                )}
                                Definir como Principal
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewVersion(version)}
                              className="border-slate-200 h-7 text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Prévia
                            </Button>
                        </div>

                        {!version.is_primary && versions.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setVersionToDelete(version)}
                            className="text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      </div>
                  );
                })}
              </div>
            </Tabs>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!versionToDelete} onOpenChange={(open) => !open && setVersionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir versão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta versão ({versionToDelete?.model_name})? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(versionToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      <VersionPreviewModal
        open={!!previewVersion}
        onOpenChange={(open) => !open && setPreviewVersion(null)}
        version={previewVersion}
        onSetPrimary={() => {
          if (previewVersion) {
            setPrimaryMutation.mutate(previewVersion.id);
          }
        }}
        isPending={setPrimaryMutation.isPending}
      />
    </>
  );
}