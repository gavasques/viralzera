import React, { useState, useEffect, useCallback } from 'react';
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Trash2, FileText, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PostFormContent from "./modal/PostFormContent";
import PostFormSettings from "./modal/PostFormSettings";
import { useSavePost, useDeletePost } from "./hooks/usePostsData";
import { STATUS_OPTIONS, DEFAULT_POST_FORM } from "./constants";

export default function PostCardModal({ open, onOpenChange, post, postTypes, onSaved }) {
  const { selectedFocusId } = useSelectedFocus();
  const isEditing = !!post?.id;
  const [isEditingContent, setIsEditingContent] = useState(!post?.id);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_POST_FORM);

  const saveMutation = useSavePost(selectedFocusId, onSaved);
  const deleteMutation = useDeletePost(selectedFocusId, onSaved);

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title || '',
        content: post.content || '',
        status: post.status || 'idea',
        post_type_id: post.post_type_id || '',
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
            <div className="px-6 pt-4 border-b border-slate-50">
              <TabsList className="w-full justify-start h-auto bg-transparent p-0 gap-6">
                <TabsTrigger 
                  value="content" 
                  className="gap-2 rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-all hover:text-indigo-500"
                >
                  <FileText className="w-4 h-4" />
                  Roteiro & Conteúdo
                </TabsTrigger>
                <TabsTrigger 
                  value="details" 
                  className="gap-2 rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-all hover:text-indigo-500"
                >
                  <LayoutList className="w-4 h-4" />
                  Detalhes da Publicação
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6 bg-slate-50/50">
              <TabsContent value="content" className="mt-6 flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <PostFormContent 
                    form={form}
                    updateForm={updateForm}
                    isEditingContent={isEditingContent}
                    setIsEditingContent={setIsEditingContent}
                  />
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-6 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <PostFormSettings 
                    form={form}
                    updateForm={updateForm}
                    postTypes={postTypes}
                  />
                </div>
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