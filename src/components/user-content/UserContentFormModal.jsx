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

const TYPE_CONFIG = {
  introduction: {
    Icon: MessageSquare,
    iconColor: 'text-blue-600',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    label: 'Introdução',
    queryKey: 'user-introductions',
    entity: 'UserIntroduction'
  },
  cta: {
    Icon: Megaphone,
    iconColor: 'text-amber-600',
    buttonColor: 'bg-amber-600 hover:bg-amber-700',
    label: 'CTA',
    queryKey: 'user-ctas',
    entity: 'UserCTA'
  },
  block: {
    Icon: Blocks,
    iconColor: 'text-green-600',
    buttonColor: 'bg-green-600 hover:bg-green-700',
    label: 'Bloco',
    queryKey: 'description-blocks',
    entity: 'DescriptionBlock'
  },
  template: {
    Icon: FileText,
    iconColor: 'text-purple-600',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    label: 'Template',
    queryKey: 'description-templates',
    entity: 'DescriptionTemplate'
  }
};

const BLOCK_TYPE_OPTIONS = [
  { value: 'social', label: 'Redes Sociais' },
  { value: 'patrocinador', label: 'Patrocinador' },
  { value: 'ferramenta', label: 'Ferramenta' },
  { value: 'link', label: 'Link' },
  { value: 'outro', label: 'Outro' }
];

const SYSTEM_PLACEHOLDERS = [
  { key: '{{resumo_video}}', description: 'Resumo do vídeo gerado pela IA' },
  { key: '{{timestamps}}', description: 'Capítulos/timestamps gerados pela IA' },
  { key: '{{tags}}', description: 'Tags SEO geradas pela IA' }
];

export default function UserContentFormModal({ open, onOpenChange, item, type }) {
  const queryClient = useQueryClient();
  const { selectedFocusId } = useSelectedFocus();
  const [formData, setFormData] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  const isEditing = !!item;
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.introduction;
  const { Icon, iconColor, buttonColor, label, queryKey, entity } = config;

  // Buscar blocos para template
  const { data: blocks = [] } = useQuery({
    queryKey: ['description-blocks', selectedFocusId],
    queryFn: () => neon.entities.DescriptionBlock.filter(
      selectedFocusId ? { focus_id: selectedFocusId } : {},
      'title'
    ),
    enabled: open && type === 'template'
  });

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  useEffect(() => {
    if (open) {
      if (item) {
        setFormData({
          title: item.title || '',
          content: item.content || '',
          slug: item.slug || '',
          type: item.type || 'outro',
          is_default: item.is_default || false,
        });
      } else {
        setFormData({
          title: '',
          content: type === 'template' ? DEFAULT_TEMPLATE : '',
          slug: '',
          type: 'outro',
          is_default: false,
        });
      }
    }
  }, [open, item, type]);

  const copyPlaceholder = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };

      // Limpar campos não relevantes por tipo
      if (type !== 'block') {
        delete payload.slug;
        delete payload.type;
      }
      if (type !== 'template') {
        delete payload.is_default;
      }

      // DescriptionTemplate requires 'name' field in DB
      if (type === 'template' && payload.title) {
        payload.name = payload.title;
      }

      if (isEditing) {
        return neon.entities[entity].update(item.id, payload);
      } else {
        return neon.entities[entity].create({
          ...payload,
          focus_id: selectedFocusId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(isEditing ? `${label} atualizado!` : `${label} criado!`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + (error.message || 'Tente novamente'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    if (!formData.content?.trim()) {
      toast.error('O conteúdo é obrigatório');
      return;
    }
    if (type === 'block' && !formData.slug?.trim()) {
      toast.error('O slug é obrigatório para blocos');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleTitleChange = (value) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      ...(type === 'block' && !prev.slug ? { slug: generateSlug(value) } : {})
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isTemplate = type === 'template';
  const isBlock = type === 'block';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isTemplate ? "max-w-4xl max-h-[90vh] flex flex-col" : "max-w-xl"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            {isEditing ? `Editar ${label}` : `Novo ${label}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={isTemplate ? "flex-1 flex flex-col overflow-hidden" : "space-y-4"}>
          {isTemplate ? (
            <div className="flex gap-6 flex-1 overflow-hidden">
              {/* Left - Form */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Template *</Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ex: Template Padrão com Patrocinador"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_default || false}
                    onCheckedChange={(checked) => handleChange('is_default', checked)}
                  />
                  <Label>Definir como template padrão</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo do Template (Markdown) *</Label>
                  <Textarea
                    id="content"
                    value={formData.content || ''}
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="Digite o template usando placeholders..."
                    className="min-h-[350px] font-mono text-sm"
                  />
                </div>
              </div>

              {/* Right - Placeholders */}
              <div className="w-96 border-l border-slate-200 pl-4 flex-shrink-0">
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
                        Nenhum bloco cadastrado. Crie blocos na aba "Blocos".
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={
                    type === 'introduction' ? 'Ex: Intro Padrão Rápida' :
                      type === 'cta' ? 'Ex: CTA para Inscrição' :
                        type === 'block' ? 'Ex: Ferramentas Favoritas' : 'Título'
                  }
                />
              </div>

              {isBlock && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (para placeholder) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug || ''}
                      onChange={(e) => handleChange('slug', generateSlug(e.target.value))}
                      placeholder="Ex: ferramentas_favoritas"
                    />
                    <p className="text-xs text-slate-500">
                      Use: <code className="bg-slate-100 px-1 rounded">{`{{bloco:${formData.slug || 'slug'}}}`}</code>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.type || 'outro'}
                      onValueChange={(value) => handleChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOCK_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo {isBlock ? '(Markdown)' : ''} *</Label>
                <Textarea
                  id="content"
                  value={formData.content || ''}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder={
                    type === 'introduction' ? 'Digite o texto da sua introdução padrão...' :
                      type === 'cta' ? 'Digite o texto do seu CTA padrão...' :
                        type === 'block' ? 'Digite o conteúdo do bloco em Markdown...' : 'Conteúdo'
                  }
                  className={isBlock ? "min-h-[200px] font-mono text-sm" : "min-h-[200px]"}
                />
                <p className="text-xs text-slate-400">
                  {(formData.content || '').length.toLocaleString()} caracteres
                </p>
              </div>
            </div>
          )}

          <DialogFooter className={isTemplate ? "pt-4 border-t mt-4" : ""}>
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
              className={buttonColor}
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

const DEFAULT_TEMPLATE = `{{resumo_video}}

---

{{timestamps}}

---

{{bloco:redes_sociais}}

---

#tags
{{tags}}`;