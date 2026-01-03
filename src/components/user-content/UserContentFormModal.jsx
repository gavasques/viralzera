import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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
import { Loader2, MessageSquare, Megaphone, Blocks, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Info } from "lucide-react";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";

const INITIAL_FORM = {
  title: '',
  content: '',
};

export default function UserContentFormModal({ open, onOpenChange, item, type }) {
  const queryClient = useQueryClient();
  const { selectedFocusId } = useSelectedFocus();
  const [formData, setFormData] = useState(INITIAL_FORM);

  const isEditing = !!item;
  const isIntroduction = type === 'introduction';
  const Icon = isIntroduction ? MessageSquare : Megaphone;
  const typeLabel = isIntroduction ? 'Introdução' : 'CTA';

  useEffect(() => {
    if (open) {
      if (item) {
        setFormData({
          title: item.title || '',
          content: item.content || '',
        });
      } else {
        setFormData(INITIAL_FORM);
      }
    }
  }, [open, item]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const entity = isIntroduction 
        ? base44.entities.UserIntroduction 
        : base44.entities.UserCTA;
      
      if (isEditing) {
        return entity.update(item.id, data);
      } else {
        return entity.create({
          ...data,
          focus_id: selectedFocusId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: isIntroduction ? ['user-introductions'] : ['user-ctas'] 
      });
      toast.success(isEditing ? `${typeLabel} atualizada!` : `${typeLabel} criada!`);
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
    if (!formData.content.trim()) {
      toast.error('O conteúdo é obrigatório');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${isIntroduction ? 'text-blue-600' : 'text-amber-600'}`} />
            {isEditing ? `Editar ${typeLabel}` : `Nova ${typeLabel}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder={isIntroduction ? 'Ex: Intro Padrão Rápida' : 'Ex: CTA para Inscrição'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder={isIntroduction 
                ? 'Digite o texto da sua introdução padrão...' 
                : 'Digite o texto do seu CTA padrão...'}
              className="min-h-[200px]"
            />
            <p className="text-xs text-slate-400">
              {formData.content.length.toLocaleString()} caracteres
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
              className={isIntroduction ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}
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