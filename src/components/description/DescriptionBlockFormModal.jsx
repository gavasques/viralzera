import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const TYPE_OPTIONS = [
  { value: 'social', label: 'Redes Sociais' },
  { value: 'patrocinador', label: 'Patrocinador' },
  { value: 'ferramenta', label: 'Ferramenta' },
  { value: 'link', label: 'Link' },
  { value: 'outro', label: 'Outro' }
];

export default function DescriptionBlockFormModal({ open, onOpenChange, block, focusId }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    type: 'outro'
  });

  useEffect(() => {
    if (block) {
      setFormData({
        title: block.title || '',
        slug: block.slug || '',
        content: block.content || '',
        type: block.type || 'outro'
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        content: '',
        type: 'outro'
      });
    }
  }, [block, open]);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleTitleChange = (value) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value)
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        focus_id: focusId
      };
      if (block?.id) {
        return base44.entities.DescriptionBlock.update(block.id, payload);
      }
      return base44.entities.DescriptionBlock.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['description-blocks'] });
      toast.success(block ? 'Bloco atualizado!' : 'Bloco criado!');
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error('Erro ao salvar: ' + err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {block ? 'Editar Bloco' : 'Novo Bloco de Descrição'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: Ferramentas Favoritas"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug (para placeholder) *</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                placeholder="Ex: ferramentas_favoritas"
              />
              <p className="text-xs text-slate-500">
                Use: <code className="bg-slate-100 px-1 rounded">{`{{bloco:${formData.slug || 'slug'}}}`}</code>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conteúdo (Markdown) *</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Digite o conteúdo do bloco em Markdown..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {block ? 'Salvar' : 'Criar Bloco'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}