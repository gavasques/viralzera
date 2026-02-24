import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";

const TEXT_TYPES = [
  { value: 'script', label: 'Script/Roteiro' },
  { value: 'reference', label: 'Referência' },
  { value: 'notes', label: 'Notas' },
  { value: 'research', label: 'Pesquisa' },
  { value: 'outline', label: 'Estrutura/Outline' },
  { value: 'other', label: 'Outro' }
];

export default function AddTextModal({ open, onOpenChange, modelingId, textToEdit }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    text_type: 'reference',
    purpose: ''
  });

  // Load textToEdit into formData when it changes
  React.useEffect(() => {
    if (textToEdit) {
      setFormData({
        title: textToEdit.title || '',
        description: textToEdit.description || '',
        content: textToEdit.content || '',
        text_type: textToEdit.text_type || 'reference',
        purpose: textToEdit.purpose || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        content: '',
        text_type: 'reference',
        purpose: ''
      });
    }
  }, [textToEdit, open]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        modeling_id: modelingId,
        character_count: data.content.length,
        token_estimate: Math.ceil(data.content.length / 4)
      };

      let result;
      if (textToEdit) {
        await neon.entities.ModelingText.update(textToEdit.id, payload);
        result = { ...textToEdit, ...payload };
      } else {
        result = await neon.entities.ModelingText.create(payload);
      }

      // Update modeling totals
      const allTexts = await neon.entities.ModelingText.filter({ modeling_id: modelingId });
      const allVideos = await neon.entities.ModelingVideo.filter({ modeling_id: modelingId });
      
      const textChars = allTexts.reduce((sum, t) => sum + (t.character_count || 0), 0);
      const textTokens = allTexts.reduce((sum, t) => sum + (t.token_estimate || 0), 0);
      const videoChars = allVideos.reduce((sum, v) => sum + (v.character_count || 0), 0);
      const videoTokens = allVideos.reduce((sum, v) => sum + (v.token_estimate || 0), 0);

      await neon.entities.Modeling.update(modelingId, {
        total_characters: textChars + videoChars,
        total_tokens_estimate: textTokens + videoTokens
      });

      return result;
    },
    onSuccess: (newText) => {
      queryClient.invalidateQueries({ queryKey: ['modelingTexts', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      
      toast.success(textToEdit ? 'Texto atualizado!' : 'Texto adicionado!');

      // Run analysis safely
      if (neon.functions?.invoke) {
        neon.functions.invoke('runModelingAnalysis', {
          modeling_id: modelingId,
          materialId: newText.id || textToEdit.id,
          materialType: 'text',
          content: newText.content || (newText && newText.content) || ''
        }).catch(err => {
          console.error('Erro ao analisar texto:', err);
        });
      } else {
        console.warn('Função de análise indisponível no momento');
      }
      
      setFormData({ title: '', description: '', content: '', text_type: 'reference', purpose: '' });
      onOpenChange(false);
    },
    onError: (err) => {
      console.error('Erro ao salvar texto:', err);
      toast.error('Erro ao salvar: ' + err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Digite um título');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Digite o conteúdo');
      return;
    }

    createMutation.mutate(formData);
  };

  const charCount = formData.content.length;
  const tokenEstimate = Math.ceil(charCount / 4);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {textToEdit ? 'Editar Texto' : 'Adicionar Texto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nome do texto"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={formData.text_type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, text_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="O que é este texto..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Conteúdo *</Label>
              <span className="text-xs text-slate-500">
                {charCount.toLocaleString()} caracteres • ~{tokenEstimate.toLocaleString()} tokens
              </span>
            </div>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Cole ou digite o texto aqui..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Finalidade do Material (opcional)</Label>
            <Textarea
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="Ex: Analisar o tom de voz, extrair insights principais, identificar estrutura argumentativa..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-slate-500">Informe o que a IA deve focar ao analisar este texto</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (textToEdit ? 'Salvar Alterações' : 'Adicionar Texto')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}