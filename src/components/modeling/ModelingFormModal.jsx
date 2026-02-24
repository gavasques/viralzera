import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PLATFORMS = [
  "YouTube",
  "YouTube Shorts",
  "TikTok",
  "Instagram Reels",
  "Podcast",
  "Outro"
];

const CONTENT_TYPES = [
  "Tutorial",
  "Review",
  "Vlog",
  "Podcast",
  "Entrevista",
  "Storytelling",
  "Educacional",
  "Entretenimento",
  "Outro"
];

export default function ModelingFormModal({ open, onOpenChange, modeling, focusId }) {
  const queryClient = useQueryClient();
  const isEditing = !!modeling?.id;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_platform: 'YouTube',
    content_type: 'Educacional',
    tags: []
  });

  useEffect(() => {
    if (open) {
      if (modeling?.id) {
        setFormData({
          title: modeling.title || '',
          description: modeling.description || '',
          target_platform: modeling.target_platform || 'YouTube',
          content_type: modeling.content_type || 'Educacional',
          tags: modeling.tags || []
        });
      } else {
        setFormData({
          title: '',
          description: '',
          target_platform: 'YouTube',
          content_type: 'Educacional',
          tags: []
        });
      }
    }
  }, [open, modeling]);

  const createMutation = useMutation({
    mutationFn: (data) => neon.entities.Modeling.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      queryClient.invalidateQueries({ queryKey: ['modelings-wizard-tema'] });
      toast.success('Modelagem criada!');
      onOpenChange(false);
    },
    onError: (err) => toast.error('Erro ao criar: ' + err.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => neon.entities.Modeling.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      queryClient.invalidateQueries({ queryKey: ['modelings-wizard-tema'] });
      toast.success('Modelagem atualizada!');
      onOpenChange(false);
    },
    onError: (err) => toast.error('Erro ao atualizar: ' + err.message)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Digite um título');
      return;
    }

    const payload = {
      ...formData,
      focus_id: focusId
    };

    if (isEditing) {
      updateMutation.mutate({ id: modeling.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Modelagem' : 'Nova Modelagem'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Modelagem *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Vídeo sobre Produtividade"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Breve descrição do conteúdo a ser criado..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plataforma Alvo</Label>
              <Select 
                value={formData.target_platform} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, target_platform: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Conteúdo</Label>
              <Select 
                value={formData.content_type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, content_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-pink-600 hover:bg-pink-700">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}