import React, { useState, useEffect, useCallback } from 'react';
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Trash2, FileText, Settings } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PostFormContent from "./modal/PostFormContent";
import PostFormSettings from "./modal/PostFormSettings";
import { useAudiences, useSavePost, useDeletePost } from "./hooks/usePostsData";
import { STATUS_OPTIONS, DEFAULT_POST_FORM } from "./constants";

export default function PostCardModal({ open, onOpenChange, post, postTypes, onSaved }) {
  const { selectedFocusId } = useSelectedFocus();
  const isEditing = !!post?.id;
  const [isEditingContent, setIsEditingContent] = useState(!post?.id);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_POST_FORM);

  const { data: audiences = [] } = useAudiences(selectedFocusId);

  const saveMutation = useSavePost(selectedFocusId, onSaved);
  const deleteMutation = useDeletePost(selectedFocusId, onSaved);

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title || '',
        content: post.content || '',
        status: post.status || 'idea',
        post_type_id: post.post_type_id || '',
        audience_id: post.audience_id || '',
        platform: post.platform || '',
        priority: post.priority || 'medium',
        scheduled_date: post.scheduled_date ? new Date(post.scheduled_date) : null,
        notes: post.notes || ''
      });
      setIsEditingContent(false);
    } else {
      setForm(DEFAULT_POST_FORM);
      setIsEditingContent(true);
    }
  }, [post]);

  const updateForm = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (!form.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    saveMutation.mutate({
      id: post?.id,
      data: {
        ...form,
        scheduled_date: form.scheduled_date?.toISOString() || null
      }
    });
  }, [form, post?.id, saveMutation]);

  const handleDelete = useCallback(() => {
    setIsConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (post?.id) {
      deleteMutation.mutate(post.id);
    }
  }, [post?.id, deleteMutation]);

  const currentStatus = STATUS_OPTIONS.find(s => s.value === form.status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 shrink-0">
            <DialogTitle className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-slate-100", currentStatus?.color)}>
                {currentStatus && <currentStatus.icon className="w-5 h-5" />}
              </div>
              {isEditing ? 'Editar Postagem' : 'Nova Postagem'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulário para {isEditing ? 'editar' : 'criar'} postagem
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="mx-6 mt-4 grid grid-cols-2 w-fit">
              <TabsTrigger value="content" className="gap-2">
                <FileText className="w-4 h-4" />
                Conteúdo
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
              <TabsContent value="content" className="mt-4 flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden">
                <PostFormContent 
                  form={form}
                  updateForm={updateForm}
                  isEditingContent={isEditingContent}
                  setIsEditingContent={setIsEditingContent}
                />
              </TabsContent>

              <TabsContent value="settings" className="mt-4">
                <PostFormSettings 
                  form={form}
                  updateForm={updateForm}
                  postTypes={postTypes}
                  audiences={audiences}
                />
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="p-6 pt-4 border-t border-slate-100 flex justify-between">
            <div>
              {isEditing && (
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saveMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Tem certeza que deseja excluir esta postagem?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
      />
    </>
  );
}