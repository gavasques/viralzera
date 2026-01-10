import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sparkles, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InitialVersionsPanel({ scriptId, onVersionSelected, currentContent }) {
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionToDelete, setVersionToDelete] = useState(null);

  // Buscar apenas versões "initial" (geradas no wizard)
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['initial-versions', scriptId],
    queryFn: async () => {
      const all = await base44.entities.YoutubeScriptVersion.filter({ 
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
      const allVersions = await base44.entities.YoutubeScriptVersion.filter({ 
        script_id: scriptId,
        change_type: 'initial'
      });
      
      for (const v of allVersions) {
        await base44.entities.YoutubeScriptVersion.update(v.id, { is_primary: false });
      }

      // 2. Definir esta como principal
      await base44.entities.YoutubeScriptVersion.update(versionId, { is_primary: true });

      // 3. Atualizar o conteúdo do script principal
      const version = versions.find(v => v.id === versionId);
      if (version) {
        await base44.entities.YoutubeScript.update(scriptId, {
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
      await base44.entities.YoutubeScriptVersion.delete(versionId);
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
      <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">Versões Geradas pela IA</h3>
            <p className="text-sm text-slate-600 mb-3">
              Este roteiro foi gerado em {versions.length} versões diferentes. Escolha a principal para trabalhar ou tire ideias das outras.
            </p>

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

              {versions.map((version) => (
                <TabsContent key={version.id} value={version.id} className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {version.is_primary ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <Check className="w-3 h-3 mr-1" />
                          Principal
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setPrimaryMutation.mutate(version.id)}
                          disabled={setPrimaryMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {setPrimaryMutation.isPending ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 mr-1" />
                          )}
                          Definir como Principal
                        </Button>
                      )}
                    </div>

                    {!version.is_primary && versions.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setVersionToDelete(version)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Excluir
                      </Button>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {version.corpo.substring(0, 500)}...
                    </p>
                  </div>

                  {!version.is_primary && (
                    <p className="text-xs text-slate-500 italic">
                      💡 Dica: Você pode copiar trechos desta versão ou definir como principal para trabalhar nela.
                    </p>
                  )}
                </TabsContent>
              ))}
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
    </>
  );
}