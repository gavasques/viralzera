import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, Check, Info } from "lucide-react";
import { toast } from "sonner";

const SYSTEM_PLACEHOLDERS = [
  { key: '{{resumo_video}}', description: 'Resumo do vídeo gerado pela IA' },
  { key: '{{timestamps}}', description: 'Capítulos/timestamps gerados pela IA' },
  { key: '{{tags}}', description: 'Tags SEO geradas pela IA' }
];

export default function DescriptionTemplateFormModal({ open, onOpenChange, template, focusId }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_default: false
  });
  const [copiedKey, setCopiedKey] = useState(null);

  const { data: blocks = [] } = useQuery({
    queryKey: ['description-blocks', focusId],
    queryFn: () => base44.entities.DescriptionBlock.filter(
      focusId ? { focus_id: focusId } : {},
      'title'
    ),
    enabled: open
  });

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title || '',
        content: template.content || '',
        is_default: template.is_default || false
      });
    } else {
      setFormData({
        title: '',
        content: DEFAULT_TEMPLATE,
        is_default: false
      });
    }
  }, [template, open]);

  const copyPlaceholder = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success('Copiado!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        focus_id: focusId
      };
      if (template?.id) {
        return base44.entities.DescriptionTemplate.update(template.id, payload);
      }
      return base44.entities.DescriptionTemplate.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['description-templates'] });
      toast.success(template ? 'Template atualizado!' : 'Template criado!');
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error('Erro ao salvar: ' + err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Template' : 'Novo Template de Descrição'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-6 flex-1 overflow-hidden">
            {/* Left - Form */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Título do Template *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Template Padrão com Patrocinador"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                />
                <Label>Definir como template padrão</Label>
              </div>

              <div className="space-y-2">
                <Label>Conteúdo do Template (Markdown) *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite o template usando placeholders..."
                  className="min-h-[350px] font-mono text-sm"
                />
              </div>
            </div>

            {/* Right - Placeholders */}
            <div className="w-72 border-l border-slate-200 pl-4">
              <h4 className="font-medium text-sm mb-3">Placeholders Disponíveis</h4>
              
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {/* System Placeholders */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Gerados pela IA
                    </p>
                    <div className="space-y-1">
                      {SYSTEM_PLACEHOLDERS.map(p => (
                        <div 
                          key={p.key}
                          className="flex items-center justify-between p-2 bg-blue-50 rounded-lg group"
                        >
                          <div>
                            <code className="text-xs text-blue-700">{p.key}</code>
                            <p className="text-xs text-slate-500">{p.description}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => copyPlaceholder(p.key)}
                          >
                            {copiedKey === p.key ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Block Placeholders */}
                  {blocks.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Blocos Cadastrados</p>
                      <div className="space-y-1">
                        {blocks.map(block => {
                          const key = `{{bloco:${block.slug}}}`;
                          return (
                            <div 
                              key={block.id}
                              className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group"
                            >
                              <div>
                                <p className="text-xs font-medium">{block.title}</p>
                                <code className="text-xs text-slate-500">{key}</code>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={() => copyPlaceholder(key)}
                              >
                                {copiedKey === key ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {blocks.length === 0 && (
                    <p className="text-xs text-slate-400 italic">
                      Nenhum bloco cadastrado. Crie blocos em "Blocos de Descrição".
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {template ? 'Salvar' : 'Criar Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const DEFAULT_TEMPLATE = `{{resumo_video}}

---

{{timestamps}}

---

{{bloco:redes_sociais}}

---

{{bloco:ferramentas}}

---

#tags
{{tags}}`;