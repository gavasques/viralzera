import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Library, Pencil, Trash2, FileText, Search, Settings, FileUp, Eye, Copy } from "lucide-react";
import { toast } from "sonner";
import { useFocusData } from "@/components/hooks/useFocusData";
import { useEntityCRUD } from "@/components/hooks/useEntityCRUD";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { CardGridSkeleton } from "@/components/common/LoadingSkeleton";
import InfoCard from "@/components/common/InfoCard";
import PDFImporter from "@/components/material/PDFImporter";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function MaterialBank() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [showPDFImporter, setShowPDFImporter] = useState(false);

  const queryClient = useQueryClient();
  const { data: materials, isLoading, selectedFocusId, hasFocus } = useFocusData('Material', 'materials');

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingMaterial(null);
    setFormData({ title: "", content: "" });
  }, []);

  const { save, remove, isSaving } = useEntityCRUD('Material', 'materials', {
    onSaveSuccess: handleCloseModal,
    saveSuccessMessage: editingMaterial ? "Lista atualizada!" : "Lista criada!",
    deleteSuccessMessage: "Lista removida!"
  });

  const handleOpenModal = useCallback((material = null) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({ title: material.title, content: material.content });
    } else {
      setEditingMaterial(null);
      setFormData({ title: "", content: "" });
    }
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return toast.error("Preencha todos os campos");
    const data = { ...formData, focus_id: selectedFocusId };
    save(editingMaterial?.id, data);
  }, [formData, editingMaterial, selectedFocusId, save]);

  const confirmDelete = useCallback(() => {
    if (materialToDelete) {
      remove(materialToDelete);
      setMaterialToDelete(null);
    }
  }, [materialToDelete, remove]);

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Conteúdo copiado para a área de transferência!");
  };

  const filteredMaterials = useMemo(() => 
    materials?.filter(m => 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.content.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []
  , [materials, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <PageHeader title="Banco de Listas" subtitle="Carregando..." icon={Library} />
        <CardGridSkeleton count={6} columns={3} />
      </div>
    );
  }

  if (!hasFocus) return <div className="p-8 text-center text-slate-500">Selecione um foco para visualizar suas listas.</div>;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Banco de Listas" 
        subtitle="Organize suas listas, referências e materiais de estudo."
        icon={Library}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPDFImporter(true)} className="gap-2 bg-white">
              <FileUp className="w-4 h-4" /> Importar PDF
            </Button>
            <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200">
              <Plus className="w-4 h-4 mr-2" /> Nova Lista
            </Button>
          </div>
        }
      />

      <InfoCard 
        icon={Library}
        title="O que é o Banco de Listas?"
        description="Um espaço para armazenar referências, ideias, scripts e conteúdos que servirão de base para suas criações. A IA pode consultar este banco para enriquecer seus posts."
        variant="blue"
      />

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar listas e materiais..."
          className="pl-10 bg-white border-slate-200 h-10 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.length === 0 ? (
          <div className="col-span-full">
            <EmptyState 
              icon={Library}
              title="Nenhuma lista encontrada"
              description="Comece criando sua primeira lista ou importando um PDF."
              actionLabel="Criar Nova Lista"
              onAction={() => handleOpenModal()}
            />
          </div>
        ) : (
           filteredMaterials?.map((material) => (
            <Card key={material.id} className="flex flex-col hover:shadow-lg transition-all duration-300 group border-slate-200 bg-white h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {material.title}
                  </CardTitle>
                </div>
                <CardDescription className="flex items-center gap-2 text-xs pt-1">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-normal">
                      <FileText className="w-3 h-3 mr-1" />
                      {material.content.length} caracteres
                    </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <div 
                  className="bg-slate-50 p-4 rounded-lg border border-slate-100 h-40 overflow-hidden relative cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => setViewingMaterial(material)}
                >
                    <p className="text-sm text-slate-600 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                        {material.content.slice(0, 400)}
                    </p>
                    <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-slate-50 to-transparent" />
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t border-slate-50 flex justify-end gap-1 bg-slate-50/30 rounded-b-xl">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setViewingMaterial(material)}
                  className="text-slate-500 hover:text-indigo-600 h-8 px-2"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4 mr-1.5" /> Visualizar
                </Button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleOpenModal(material)}
                  className="text-slate-400 hover:text-indigo-600 h-8 w-8"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMaterialToDelete(material.id)}
                  className="text-slate-400 hover:text-red-600 h-8 w-8"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Edit/Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="px-6 py-4 border-b bg-slate-50/50">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingMaterial ? 'Editar Lista' : 'Nova Lista'}</DialogTitle>
              <DialogDescription>
                {editingMaterial ? 'Edite o conteúdo da sua lista ou material.' : 'Crie uma nova lista de referência para suas estratégias.'}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold text-slate-800">Título da Lista</Label>
              <Input 
                placeholder="Ex: 50 Ideias de Títulos Magnéticos" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="text-lg h-12"
              />
            </div>
            
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold text-slate-800">Conteúdo</Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {formData.content.length} caracteres
                </Badge>
              </div>
              <div className="relative">
                <Textarea 
                  placeholder="Cole aqui seu texto, lista ou material de referência..." 
                  className="min-h-[400px] font-mono text-sm leading-relaxed p-4 resize-y"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  maxLength={50000}
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-slate-50/50 flex justify-end gap-3">
            <Button variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]">
              {isSaving ? 'Salvando...' : 'Salvar Lista'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewingMaterial} onOpenChange={(open) => !open && setViewingMaterial(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
          <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-start">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl leading-normal">{viewingMaterial?.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white">
                  {viewingMaterial?.content.length} caracteres
                </Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-1">
               <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(viewingMaterial?.content)} title="Copiar conteúdo">
                 <Copy className="w-4 h-4 text-slate-500" />
               </Button>
               <Button variant="ghost" size="icon" onClick={() => { setViewingMaterial(null); handleOpenModal(viewingMaterial); }} title="Editar">
                 <Pencil className="w-4 h-4 text-slate-500" />
               </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-6">
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700 bg-slate-50 p-6 rounded-lg border border-slate-100">
              {viewingMaterial?.content}
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t bg-slate-50/50 flex justify-end">
            <Button variant="outline" onClick={() => setViewingMaterial(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={!!materialToDelete}
        onOpenChange={(open) => !open && setMaterialToDelete(null)}
        title="Tem certeza que deseja excluir esta lista?"
        description="Esta ação não pode ser desfeita. O material será permanentemente removido do seu banco."
        confirmLabel="Excluir Lista"
        onConfirm={confirmDelete}
        variant="danger"
      />

      <PDFImporter 
        open={showPDFImporter} 
        onOpenChange={setShowPDFImporter}
        focusId={selectedFocusId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['materials'] })}
      />
    </div>
  );
}