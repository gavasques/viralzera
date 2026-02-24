import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ScrollText } from "lucide-react";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";

const INITIAL_FORM = {
  title: '',
  description: '',
  icon: 'FileText',
  prompt_template: '',
  group: 'Youtube',
};

export default function ScriptTypeFormModal({ open, onOpenChange, scriptType }) {
  const queryClient = useQueryClient();
  const { selectedFocusId } = useSelectedFocus();
  const [formData, setFormData] = useState(INITIAL_FORM);

  const isEditing = !!scriptType;

  useEffect(() => {
    if (open) {
      if (scriptType) {
        setFormData({
          title: scriptType.title || '',
          description: scriptType.description || '',
          icon: scriptType.icon || 'FileText',
          prompt_template: scriptType.prompt_template || '',
          group: scriptType.group || 'Youtube',
        });
      } else {
        setFormData(INITIAL_FORM);
      }
    }
  }, [open, scriptType]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEditing) {
        return neon.entities.YoutubeScriptType.update(scriptType.id, data);
      } else {
        return neon.entities.YoutubeScriptType.create({
          ...data,
          focus_id: selectedFocusId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-script-types'] });
      toast.success(isEditing ? 'Tipo de roteiro atualizado!' : 'Tipo de roteiro criado!');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + (error.message || 'Tente novamente'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-red-600" />
            {isEditing ? 'Editar Tipo de Roteiro' : 'Novo Tipo de Roteiro'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: Tutorial Passo a Passo"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Breve descrição do tipo de roteiro"
            />
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label htmlFor="icon">Ícone (nome do Lucide)</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
              placeholder="Ex: BookOpen, Video, List, Lightbulb"
            />
            <p className="text-xs text-slate-400">
              Use nomes de ícones do lucide-react (ex: BookOpen, Video, List, Lightbulb, Target)
            </p>
          </div>

          {/* Prompt Template */}
          <div className="space-y-2">
            <Label htmlFor="prompt_template">Template do Prompt</Label>
            <Textarea
              id="prompt_template"
              value={formData.prompt_template}
              onChange={(e) => handleChange('prompt_template', e.target.value)}
              placeholder="Digite o prompt base com placeholders como {{tema}}, {{persona}}, {{publico}}..."
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-xs text-slate-400">
              Use placeholders como: {"{{tema}}"}, {"{{persona}}"}, {"{{publico}}"}, {"{{materiais}}"}, {"{{modelagens}}"}, {"{{intros}}"}, {"{{ctas}}"}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Atualizar' : 'Criar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}