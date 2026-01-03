import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import AdminLayout from "@/components/admin/AdminLayout";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  FileText, 
  Pencil, 
  Trash2, 
  Star
} from "lucide-react";
import { toast } from "sonner";
import DescriptionTemplateFormModal from "@/components/description/DescriptionTemplateFormModal";
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

export default function DescriptionTemplates() {
  const { selectedFocusId } = useSelectedFocus();
  const queryClient = useQueryClient();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['description-templates', selectedFocusId],
    queryFn: () => base44.entities.DescriptionTemplate.filter(
      selectedFocusId ? { focus_id: selectedFocusId } : {},
      '-created_date'
    ),
    enabled: true
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DescriptionTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['description-templates'] });
      toast.success('Template excluído');
      setDeleteTarget(null);
    }
  });

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowFormModal(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowFormModal(true);
  };

  const filteredTemplates = templates.filter(template => 
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Templates de Descrição"
        subtitle="Templates para descrições de vídeos do YouTube"
        icon={FileText}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Template
          </Button>
        }
      />

      <div className="mb-6">
        <Input
          placeholder="Buscar templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : filteredTemplates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum template cadastrado"
          description="Crie templates com placeholders para gerar descrições personalizadas automaticamente."
          action={
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Prévia</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {template.title}
                      {template.is_default && (
                        <Badge className="bg-amber-100 text-amber-700 gap-1">
                          <Star className="w-3 h-3" />
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm max-w-md truncate">
                    {template.content?.substring(0, 100)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => setDeleteTarget(template)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DescriptionTemplateFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        template={editingTemplate}
        focusId={selectedFocusId}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{deleteTarget?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}