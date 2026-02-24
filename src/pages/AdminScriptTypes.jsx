import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { ScrollText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminProtection } from "@/components/admin/AdminProtection";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { PageSkeleton } from "@/components/common/LoadingSkeleton";
import ScriptTypeCard from "@/components/admin/script-types/ScriptTypeCard";
import ScriptTypeFormModal from "@/components/admin/script-types/ScriptTypeFormModal";
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

export default function AdminScriptTypes() {
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [deletingType, setDeletingType] = useState(null);
  const queryClient = useQueryClient();

  const { data: scriptTypes = [], isLoading } = useQuery({
    queryKey: ['youtube-script-types'],
    queryFn: () => neon.entities.YoutubeScriptType.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => neon.entities.YoutubeScriptType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-script-types'] });
      toast.success('Tipo de roteiro excluído!');
      setDeletingType(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + error.message);
    }
  });

  const handleNew = () => {
    setEditingType(null);
    setShowModal(true);
  };

  const handleEdit = (scriptType) => {
    setEditingType(scriptType);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
  };

  const handleDelete = (scriptType) => {
    setDeletingType(scriptType);
  };

  const confirmDelete = () => {
    if (deletingType) {
      deleteMutation.mutate(deletingType.id);
    }
  };

  return (
    <AdminProtection>
      <div className="space-y-6">
        <PageHeader
          title="Tipos de Roteiros do YouTube"
          subtitle="Gerencie os templates e prompts para cada formato de vídeo"
          icon={ScrollText}
          actions={
            <Button onClick={handleNew} className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Tipo de Roteiro
            </Button>
          }
        />

        {isLoading ? (
          <PageSkeleton />
        ) : scriptTypes.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Nenhum tipo de roteiro cadastrado"
            description="Crie seu primeiro tipo de roteiro com um template de prompt"
            actionLabel="Criar Tipo de Roteiro"
            onAction={handleNew}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scriptTypes.map((scriptType) => (
              <ScriptTypeCard
                key={scriptType.id}
                scriptType={scriptType}
                onEdit={() => handleEdit(scriptType)}
                onDelete={() => handleDelete(scriptType)}
              />
            ))}
          </div>
        )}

        <ScriptTypeFormModal
          open={showModal}
          onOpenChange={handleCloseModal}
          scriptType={editingType}
        />

        <AlertDialog open={!!deletingType} onOpenChange={(open) => !open && setDeletingType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir tipo de roteiro?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deletingType?.title}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminProtection>
  );
}