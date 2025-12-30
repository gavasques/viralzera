import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Trash2, Info, LayoutTemplate, MessageSquare, List } from "lucide-react";

const INITIAL_FORM_STATE = {
  title: "",
  channel: "Instagram",
  format: "Post",
  description: "",
  creation_instructions: "",
  content_structure: "",
  character_limit: "",
  is_active: true,
  examples: []
};

export default function PostTypeFormModal({ 
  open, 
  onOpenChange, 
  initialData, 
  onSave, 
  isSaving 
}) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          title: initialData.title || "",
          channel: initialData.channel || "Instagram",
          format: initialData.format || "Post",
          description: initialData.description || "",
          creation_instructions: initialData.creation_instructions || "",
          content_structure: initialData.content_structure || "",
          character_limit: initialData.character_limit || "",
          is_active: initialData.is_active !== false,
          examples: initialData.examples || []
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
      setActiveTab("general");
    }
  }, [open, initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRemoveExample = (index) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-white z-10">
          <DialogTitle>{initialData ? 'Editar Tipo de Postagem' : 'Novo Tipo de Postagem'}</DialogTitle>
          <DialogDescription>
            Configure como a IA deve estruturar e criar este formato de conteúdo.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-2 bg-slate-50/50 border-b border-slate-100">
            <TabsList className="grid w-full grid-cols-3 mb-2">
              <TabsTrigger value="general" className="gap-2">
                <Info className="w-4 h-4" /> Informações Básicas
              </TabsTrigger>
              <TabsTrigger value="prompting" className="gap-2">
                <LayoutTemplate className="w-4 h-4" /> Estrutura & Prompt
              </TabsTrigger>
              <TabsTrigger value="examples" className="gap-2">
                <List className="w-4 h-4" /> Exemplos ({formData.examples.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 bg-slate-50/30">
            <div className="p-6">
              
              {/* ABA GERAL */}
              <TabsContent value="general" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna Esquerda */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Canal <span className="text-red-500">*</span></Label>
                      <Select 
                        value={formData.channel} 
                        onValueChange={(val) => handleChange('channel', val)}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Youtube">Youtube</SelectItem>
                          <SelectItem value="X">X (Twitter)</SelectItem>
                          <SelectItem value="TikTok">TikTok</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Nome do Tipo <span className="text-red-500">*</span></Label>
                      <Input 
                        className="bg-white"
                        placeholder="Ex: Reels Narrado, Carrossel Educativo" 
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Formato Base <span className="text-red-500">*</span></Label>
                      <Select 
                        value={formData.format} 
                        onValueChange={(val) => handleChange('format', val)}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Post">Post (Imagem única/Texto)</SelectItem>
                          <SelectItem value="Carrossel">Carrossel</SelectItem>
                          <SelectItem value="Reels">Reels / Shorts / TikTok</SelectItem>
                          <SelectItem value="Story">Story</SelectItem>
                          <SelectItem value="Video">Vídeo Longo</SelectItem>
                          <SelectItem value="Thread">Thread / Fio</SelectItem>
                          <SelectItem value="Article">Artigo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Coluna Direita */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          {formData.is_active ? (
                            <div className="p-2 bg-emerald-100 rounded-full">
                              <Eye className="w-4 h-4 text-emerald-600" />
                            </div>
                          ) : (
                            <div className="p-2 bg-slate-100 rounded-full">
                              <EyeOff className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-slate-700 block">
                              {formData.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formData.is_active ? 'Disponível no gerador de scripts' : 'Oculto no gerador de scripts'}
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) => handleChange('is_active', checked)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Limite / Duração</Label>
                      <Input 
                        className="bg-white"
                        placeholder="Ex: 2200 chars (Legenda), 15s (Vídeo)"
                        value={formData.character_limit}
                        onChange={(e) => handleChange('character_limit', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Objetivo / Descrição</Label>
                      <Textarea 
                        className="bg-white min-h-[80px]"
                        placeholder="Qual o objetivo deste formato? (Ex: Educar, Entreter, Vender)" 
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ABA PROMPTING */}
              <TabsContent value="prompting" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  <div className="space-y-2 flex flex-col h-full">
                    <Label className="flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-indigo-500" />
                      Estrutura de Conteúdo
                    </Label>
                    <p className="text-xs text-slate-500 mb-2">
                      Defina o esqueleto do conteúdo. A IA seguirá essa estrutura rigorosamente.
                    </p>
                    <Textarea 
                      className="bg-white font-mono text-sm flex-1 min-h-[300px] p-4 leading-relaxed"
                      placeholder={`Exemplo:
1. Gancho (3s iniciais) - Quebrar padrão
2. Contexto / Problema
3. Solução / Dica Prática
4. CTA Final`}
                      value={formData.content_structure}
                      onChange={(e) => handleChange('content_structure', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 flex flex-col h-full">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                      Instruções de Criação
                    </Label>
                    <p className="text-xs text-slate-500 mb-2">
                      Dicas extras para a IA. Tom de voz específico para este formato, regras, etc.
                    </p>
                    <Textarea 
                      className="bg-white flex-1 min-h-[300px] p-4 leading-relaxed"
                      placeholder="Ex: Use linguagem direta e provocativa. Evite introduções longas. Foque em listas numeradas..."
                      value={formData.creation_instructions}
                      onChange={(e) => handleChange('creation_instructions', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* ABA EXEMPLOS */}
              <TabsContent value="examples" className="mt-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-medium text-slate-900">Exemplos Cadastrados</h3>
                      <p className="text-sm text-slate-500">
                        Estes exemplos são usados como referência "few-shot" para a IA.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {formData.examples.length} exemplos
                    </Badge>
                  </div>
                  
                  {formData.examples.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-200">
                      <div className="bg-slate-50 p-3 rounded-full w-fit mx-auto mb-3">
                        <List className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">Nenhum exemplo vinculado</p>
                      <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">
                        Salve este tipo primeiro, depois use o botão "Adicionar Exemplo" no card principal para adicionar novos.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {formData.examples.map((ex, i) => {
                         const content = typeof ex === 'string' ? ex : ex.content;
                         const comment = typeof ex === 'string' ? "" : ex.comment;
                         const sourceType = typeof ex === 'string' ? "third_party" : (ex.source_type || "third_party");
                         
                         return (
                          <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors group">
                            <div className="shrink-0 mt-1">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                                {i + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 mb-1">
                                {sourceType === 'mine' ? (
                                    <Badge variant="default" className="text-[10px] h-5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200 shadow-none">Autoral</Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-[10px] h-5 shadow-none">Referência</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-3 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                                {content}
                              </p>
                              {comment && (
                                <p className="text-xs text-slate-500 italic flex items-center gap-1 mt-1">
                                  <Info className="w-3 h-3" />
                                  {comment}
                                </p>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              onClick={() => handleRemoveExample(i)}
                              title="Remover exemplo deste tipo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                         );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !formData.title.trim()}>
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}