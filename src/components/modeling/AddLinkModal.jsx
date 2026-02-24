import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import { Plus, X, ExternalLink, Loader2 } from "lucide-react";

export default function AddLinkModal({ open, onOpenChange, modelingId }) {
  const queryClient = useQueryClient();
  const [links, setLinks] = useState([{ url: '', title: '', notes: '', purpose: '' }]);

  const createMutation = useMutation({
    mutationFn: async (linksData) => {
      const promises = linksData.map(link =>
        neon.entities.ModelingLink.create({
          modeling_id: modelingId,
          url: link.url,
          title: link.title || null,
          notes: link.notes || null,
          purpose: link.purpose || null,
          status: 'pending'
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Links adicionados!');
      setLinks([{ url: '', title: '', notes: '', purpose: '' }]);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erro ao adicionar links: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const validLinks = links.filter(l => l.url.trim());
    
    if (validLinks.length === 0) {
      toast.error('Adicione pelo menos um link');
      return;
    }

    // Validate URLs
    const invalidUrls = validLinks.filter(l => {
      try {
        new URL(l.url);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidUrls.length > 0) {
      toast.error('Alguns links são inválidos');
      return;
    }

    createMutation.mutate(validLinks);
  };

  const addLink = () => {
    setLinks([...links, { url: '', title: '', notes: '', purpose: '' }]);
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-sky-600" />
            Adicionar Links
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
          {links.map((link, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Link {index + 1}</Label>
                {links.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeLink(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`url-${index}`}>URL *</Label>
                <Input
                  id={`url-${index}`}
                  placeholder="https://exemplo.com/artigo"
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`title-${index}`}>Título (opcional)</Label>
                <Input
                  id={`title-${index}`}
                  placeholder="Nome do artigo"
                  value={link.title}
                  onChange={(e) => updateLink(index, 'title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`notes-${index}`}>Notas (opcional)</Label>
                <Textarea
                  id={`notes-${index}`}
                  placeholder="Por que este link é relevante..."
                  value={link.notes}
                  onChange={(e) => updateLink(index, 'notes', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`purpose-${index}`}>Finalidade do Material (opcional)</Label>
                <Textarea
                  id={`purpose-${index}`}
                  placeholder="Ex: Extrair dados e estatísticas, identificar argumentos principais, analisar formato do conteúdo..."
                  value={link.purpose}
                  onChange={(e) => updateLink(index, 'purpose', e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-slate-500">Informe o que a IA deve focar ao processar este link</p>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addLink}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Outro Link
          </Button>
        </form>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-sky-600 hover:bg-sky-700"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Adicionar Links'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}