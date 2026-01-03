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
  Blocks, 
  Pencil, 
  Trash2, 
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";
import DescriptionBlockFormModal from "@/components/description/DescriptionBlockFormModal";
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

const TYPE_LABELS = {
  social: { label: 'Redes Sociais', color: 'bg-blue-100 text-blue-700' },
  patrocinador: { label: 'Patrocinador', color: 'bg-amber-100 text-amber-700' },
  ferramenta: { label: 'Ferramenta', color: 'bg-green-100 text-green-700' },
  link: { label: 'Link', color: 'bg-purple-100 text-purple-700' },
  outro: { label: 'Outro', color: 'bg-slate-100 text-slate-700' }
};

export default function DescriptionBlocks() {
  const { selectedFocusId } = useSelectedFocus();
  const queryClient = useQueryClient();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['description-blocks', selectedFocusId],
    queryFn: () => base44.entities.DescriptionBlock.filter(
      selectedFocusId ? { focus_id: selectedFocusId } : {},
      '-created_date'
    ),
    enabled: true
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DescriptionBlock.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['description-blocks'] });
      toast.success('Bloco excluído');
      setDeleteTarget(null);
    }
  });

  const handleEdit = (block) => {
    setEditingBlock(block);
    setShowFormModal(true);
  };

  const handleCreate = () => {
    setEditingBlock(null);
    setShowFormModal(true);
  };

  const copyPlaceholder = (slug) => {
    navigator.clipboard.writeText(`{{bloco:${slug}}}`);
    setCopiedSlug(slug);
    toast.success('Placeholder copiado!');
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const filteredBlocks = blocks.filter(block => 
    block.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    block.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Blocos de Descrição"
        subtitle="Blocos reutilizáveis para templates de descrição do YouTube"
        icon={Blocks}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Bloco
          </Button>
        }
      />

      <div className="mb-6">
        <Input
          placeholder="Buscar blocos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : filteredBlocks.length === 0 ? (
        <EmptyState
          icon={Blocks}
          title="Nenhum bloco cadastrado"
          description="Crie blocos reutilizáveis como links de redes sociais, ferramentas, patrocinadores, etc."
          action={
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Bloco
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Placeholder</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBlocks.map((block) => (
                <TableRow key={block.id}>
                  <TableCell className="font-medium">{block.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {`{{bloco:${block.slug}}}`}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyPlaceholder(block.slug)}
                      >
                        {copiedSlug === block.slug ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={TYPE_LABELS[block.type]?.color || TYPE_LABELS.outro.color}>
                      {TYPE_LABELS[block.type]?.label || 'Outro'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(block)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => setDeleteTarget(block)}
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

      <DescriptionBlockFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        block={editingBlock}
        focusId={selectedFocusId}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bloco?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o bloco "{deleteTarget?.title}"? 
              Templates que usam este bloco podem ser afetados.
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