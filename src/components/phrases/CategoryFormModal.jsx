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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";

const COLORS = [
  { value: "blue", label: "Azul" },
  { value: "indigo", label: "Índigo" },
  { value: "purple", label: "Roxo" },
  { value: "pink", label: "Rosa" },
  { value: "red", label: "Vermelho" },
  { value: "orange", label: "Laranja" },
  { value: "amber", label: "Âmbar" },
  { value: "yellow", label: "Amarelo" },
  { value: "green", label: "Verde" },
  { value: "teal", label: "Azul-verde" },
  { value: "cyan", label: "Ciano" },
  { value: "slate", label: "Cinza" }
];

export default function CategoryFormModal({ open, onOpenChange, category }) {
  const queryClient = useQueryClient();
  const { selectedFocusId } = useSelectedFocus();
  const [formData, setFormData] = useState({
    name: '',
    color: 'blue'
  });

  const isEditing = !!category;

  useEffect(() => {
    if (open) {
      if (category) {
        setFormData({
          name: category.name || '',
          color: category.color || 'blue'
        });
      } else {
        setFormData({
          name: '',
          color: 'blue'
        });
      }
    }
  }, [open, category]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEditing) {
        return neon.entities.PhraseCategory.update(category.id, data);
      } else {
        return neon.entities.PhraseCategory.create({
          ...data,
          focus_id: selectedFocusId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phrase-categories'] });
      toast.success(isEditing ? 'Categoria atualizada!' : 'Categoria criada!');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + (error.message || 'Tente novamente'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Digite o nome da categoria');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Motivação, Sabedoria, Humor..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <Select 
              value={formData.color} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map(color => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full bg-${color.value}-500`} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                isEditing ? 'Atualizar' : 'Criar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}