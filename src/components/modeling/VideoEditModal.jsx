import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import { Loader2, Youtube } from "lucide-react";

export default function VideoEditModal({ open, onOpenChange, video, modelingId }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    purpose: ''
  });

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title || '',
        notes: video.notes || '',
        purpose: video.purpose || ''
      });
    }
  }, [video]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await neon.entities.ModelingVideo.update(video.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });
      toast.success('Vídeo atualizado!');
      onOpenChange(false);
    },
    onError: (err) => toast.error('Erro ao atualizar: ' + err.message)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            Editar Vídeo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título do vídeo"
            />
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre o vídeo..."
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Finalidade do Material (opcional)</Label>
            <Textarea
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="Ex: Analisar a estrutura do roteiro, identificar o foco do criador, estudar o gancho utilizado..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-slate-500">Informe o que a IA deve focar ao analisar este vídeo</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}