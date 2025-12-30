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
import { toast } from "sonner";

const PLATFORMS = ["YouTube", "YouTube Shorts", "TikTok", "Instagram Reels", "Podcast", "Outro"];
const CONTENT_TYPES = ["Tutorial", "Review", "Vlog", "Podcast", "Entrevista", "Storytelling", "Educacional", "Entretenimento", "Outro"];

export default function ModelingFormModal({ open, onOpenChange, modeling, focusId }) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_platform: 'YouTube',
    content_type: 'Educacional',
    creator_idea: ''
  });

  useEffect(() => {
    if (modeling) {
      setFormData({
        title: modeling.title || '',
        description: modeling.description || '',
        target_platform: modeling.target_platform || 'YouTube',
        content_type: modeling.content_type || 'Educacional',
        creator_idea: modeling.creator_idea || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        target_platform: 'YouTube',
        content_type: 'Educacional',
        creator_idea: ''
      });
    }
  }, [modeling, open]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (modeling) {
        return base44.entities.Modeling.update(modeling.id, data);
      }
      return base44.entities.Modeling.create({ ...data, focus_id: focusId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success(modeling ? 'Modelagem atualizada!' : 'Modelagem criada!');
      onOpenChange(false);
    },
    onError: (err) => toast.error('Erro: ' + err.message)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{modeling ? 'Editar Modelagem' : 'Nova Modelagem'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Vídeo sobre produtividade..."
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Breve descrição da modelagem..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plataforma</Label>
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

          <div className="space-y-2">
            <Label>Ideia do Criador</Label>
            <Textarea
              value={formData.creator_idea}
              onChange={(e) => setFormData(prev => ({ ...prev, creator_idea: e.target.value }))}
              placeholder="Suas ideias, objetivos e direção para este conteúdo..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : (modeling ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}