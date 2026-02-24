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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";

export default function PhraseFormModal({ open, onOpenChange, phrase, categories, onNewCategory }) {
  const queryClient = useQueryClient();
  const { selectedFocusId } = useSelectedFocus();
  const [formData, setFormData] = useState({
    text: '',
    category_id: '',
    reason: ''
  });

  const isEditing = !!phrase;

  useEffect(() => {
    if (open) {
      if (phrase) {
        setFormData({
          text: phrase.text || '',
          category_id: phrase.category_id || '',
          reason: phrase.reason || ''
        });
      } else {
        setFormData({
          text: '',
          category_id: '',
          reason: ''
        });
      }
    }
  }, [open, phrase]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEditing) {
        return neon.entities.Phrase.update(phrase.id, data);
      } else {
        return neon.entities.Phrase.create({
          ...data,
          focus_id: selectedFocusId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phrases', selectedFocusId] });
      toast.success(isEditing ? 'Frase atualizada!' : 'Frase adicionada!');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + (error.message || 'Tente novamente'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      toast.error('Digite o texto da frase');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Frase' : 'Nova Frase'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Frase *</Label>
            <Textarea
              id="text"
              value={formData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Digite a frase que você gosta..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <div className="flex gap-2">
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma categoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sem categoria</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onNewCategory}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Por que gosto dessa frase? (opcional)</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Explique o motivo..."
              className="min-h-[80px]"
            />
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
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Atualizar' : 'Adicionar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}