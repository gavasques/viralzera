import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { neon } from "@/api/neonClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/components/services/OpenRouterDirectService";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, Check, RefreshCw, History, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

export default function YoutubeDescriptionGeneratorModal({ 
  open, 
  onOpenChange, 
  scriptTitle, 
  scriptId,
  transcription,
  onDescriptionGenerated,
  onTranscriptionChange
}) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState(null);
  const [copiedItem, setCopiedItem] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState(null);

  // Buscar versões salvas da descrição
  const { data: descriptionVersions = [], isLoading: isLoadingVersions } = useQuery({
    queryKey: ['youtube-description-versions', scriptId],
    queryFn: () => neon.entities.YoutubeKitVersion.filter(
      { script_id: scriptId },
      '-created_date'
    ),
    enabled: open && !!scriptId
  });

  // Buscar templates de descrição
  const { data: templates = [] } = useQuery({
    queryKey: ['description-templates'],
    queryFn: () => neon.entities.DescriptionTemplate.list('-created_date', 50),
    enabled: open
  });

  // Buscar blocos de descrição para substituição no template
  const { data: blocks = [] } = useQuery({
    queryKey: ['description-blocks'],
    queryFn: () => neon.entities.DescriptionBlock.list('-created_date', 100),
    enabled: open
  });

  // Auto-selecionar template padrão
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      } else {
        setSelectedTemplateId(templates[0].id);
      }
    }
  }, [templates, selectedTemplateId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setDescription(null);
      setSelectedVersionId(null);
    }
  }, [open]);

  const generateDescription = async () => {
    if (!transcription && !scriptTitle) {
      toast.error('Adicione uma transcrição ou roteiro para gerar a descrição');
      return;
    }

    setIsGenerating(true);
    try {
      // Buscar configuração do agente
      const configs = await neon.entities.YoutubeKitGeneratorConfig.filter({});
      const config = configs[0];

      const cfg = config?.config || {};
      if (!cfg.model) {
        throw new Error('Configure o agente "YouTube - Gerador de Kit" em Configurações de Agentes');
      }

      // Preparar conteúdo para enviar
      let contentForAnalysis = '';
      if (transcription) {
        contentForAnalysis = `TRANSCRIÇÃO DO VÍDEO:\n\n${transcription}`;
      }
      if (scriptTitle) {
        contentForAnalysis += `\n\nTÍTULO: ${scriptTitle}`;
      }

      // Buscar template selecionado se houver
      let templateContent = '';
      if (selectedTemplateId) {
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        // Suporta 'content' ou 'template_content'
        const rawContent = selectedTemplate?.content || selectedTemplate?.template_content;
        if (rawContent) {
          templateContent = rawContent;
        }
      }

      // Preparar system prompt
      let systemPrompt = config.prompt || 'Você é um especialista em otimização de conteúdo YouTube.';
      
      // Remover seções não relevantes do prompt
      systemPrompt = systemPrompt
        .replace(/## ROTEIRO PARA ANÁLISE[\s\S]*?(?=##|$)/gi, '')
        .replace(/## TEMPLATE DE DESCRIÇÃO[\s\S]*?(?=##|$)/gi, '')
        .replace(/\{\{roteiro_final\}\}/gi, '')
        .replace(/\{\{template_descricao\}\}/gi, templateContent);

      // Construir mensagem do usuário
      let userMessage = `Gere uma descrição otimizada para YouTube e extraia os capítulos (timestamps) com base no seguinte conteúdo:\n\n${contentForAnalysis}`;

      userMessage += `\n\nA descrição deve ser:
      - Otimizada para SEO
      - Engajante e clara
      - Com entre 200-500 caracteres

      FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
      {
        "descricao": "Texto da descrição aqui...",
        "capitulos": "00:00 Introdução\n01:30 Tópico 1...",
        "tags": "#tag1 #tag2 #tag3"
      }

      Retorne APENAS o JSON válido, sem markdown ou explicações.`;

      const response = await sendMessage({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        options: {
          enableReasoning: config.enable_reasoning || false,
          reasoningEffort: config.reasoning_effort || 'medium',
          enableWebSearch: config.enable_web_search || false,
          maxTokens: config.max_tokens || 2000,
          feature: 'YoutubeDescriptionGenerator'
        }
      });

      // Parsear resposta JSON
      let descricao = '';
      let capitulos = '';
      let tags = '';

      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          descricao = parsed.descricao || '';
          capitulos = parsed.capitulos || '';
          tags = parsed.tags || '';
        } else {
          // Fallback se não vier JSON
          descricao = response.content.trim();
        }
      } catch {
        descricao = response.content.trim();
      }

      // Aplicar template se selecionado
      let finalDescription = descricao;

      if (selectedTemplateId && templates.length > 0) {
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        // Suporta tanto 'content' (novo schema) quanto 'template_content' (antigo)
        const rawTemplateContent = selectedTemplate?.content || selectedTemplate?.template_content;
        
        if (rawTemplateContent) {
          // Substituir placeholders no template com conteúdo da IA
          finalDescription = rawTemplateContent
            .replace(/\{\{resumo_video\}\}/g, descricao)
            .replace(/\{\{descricao\}\}/g, descricao)
            .replace(/\{\{descricao_final\}\}/g, descricao)
            .replace(/\{\{description\}\}/g, descricao)
            .replace(/\{\{timestamps\}\}/g, capitulos)
            .replace(/\{\{capitulos\}\}/g, capitulos)
            .replace(/\{\{chapters\}\}/g, capitulos)
            .replace(/\{\{tags\}\}/g, tags);
            
          // Substituição robusta de blocos
          // Estratégia: Encontrar todas as ocorrências de {{bloco:nome}} e tentar casar com os blocos disponíveis
          finalDescription = finalDescription.replace(/\{\{bloco:([^}]+)\}\}/gi, (match, capturedSlug) => {
              const slugToFind = capturedSlug.trim();
              
              if (!blocks || blocks.length === 0) return match;

              // 1. Tenta encontrar pelo slug exato (case insensitive)
              let foundBlock = blocks.find(b => b.slug?.toLowerCase() === slugToFind.toLowerCase());

              // 2. Se não achar, tenta normalizar _ e - (ex: redes_sociais vs redes-sociais)
              if (!foundBlock) {
                  const normalizedSlug = slugToFind.replace(/-/g, '_').toLowerCase();
                  foundBlock = blocks.find(b => b.slug?.replace(/-/g, '_').toLowerCase() === normalizedSlug);
              }

              // 3. Se ainda não achar, tenta encontrar pelo título (slugify básico)
              if (!foundBlock) {
                   foundBlock = blocks.find(b => {
                       const titleSlug = b.title?.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
                       const searchSlug = slugToFind.toLowerCase().replace(/-/g, '_');
                       return titleSlug === searchSlug;
                   });
              }

              return foundBlock ? foundBlock.content : match;
          });
          
          // Opcional: Remover placeholders de bloco que não foram encontrados para não ficar "sujo"
          // finalDescription = finalDescription.replace(/\{\{bloco:[^}]+\}\}/gi, '');
        }
      } else if (capitulos) {
        // Se não tem template, incluir capítulos
        finalDescription += `\n\n⏱️ CAPÍTULOS:\n${capitulos}`;
      }

      setDescription(finalDescription);

      // Salvar versão no banco
      if (scriptId) {
        try {
          const savedVersion = await neon.entities.YoutubeKitVersion.create({
            script_id: scriptId,
            descricao_completa: finalDescription,
            template_id: selectedTemplateId || null
          });
          setSelectedVersionId(savedVersion.id);
          queryClient.invalidateQueries({ queryKey: ['youtube-description-versions', scriptId] });
        } catch (saveError) {
          // Silently fail - description was still generated successfully
        }
      }

      toast.success('Descrição gerada com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar descrição: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedItem('description');
    toast.success('Copiado!');
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleTranscriptionChange = (newTranscription) => {
    onTranscriptionChange?.(newTranscription);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            Gerar Descrição YouTube
          </DialogTitle>
        </DialogHeader>

        {!description && !isGenerating && (
          <div className="flex-1 overflow-y-auto flex flex-col gap-6 p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-red-50 p-4 rounded-full">
                <Sparkles className="w-10 h-10 text-red-500" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg text-slate-900 mb-1">Gerar Descrição Otimizada</h3>
                <p className="text-sm text-slate-500">
                  Cole sua transcrição do vídeo para gerar uma descrição otimizada para SEO do YouTube.
                </p>
              </div>
            </div>

            {/* Transcrição Input */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-sm font-medium">📝 Transcrição com Timestamps</span>
              </Label>
              <textarea
                value={transcription}
                onChange={(e) => handleTranscriptionChange(e.target.value)}
                placeholder="Cole aqui a transcrição do vídeo com timestamps (ex: [00:00] Introdução... [00:30] Conteúdo principal...)"
                className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg bg-white font-mono resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500">Isso ajuda a gerar uma descrição mais relevante e com timestamps.</p>
            </div>

            {/* Mostrar descrições anteriores se existirem */}
            {descriptionVersions.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {descriptionVersions.length} descrição(ões) gerada(s)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const latestVersion = descriptionVersions[0];
                      setDescription(latestVersion.descricao_completa || '');
                      setSelectedVersionId(latestVersion.id);
                    }}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    Ver Última
                  </Button>
                </div>
              </div>
            )}

            {/* Template Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-sm font-medium">Template de Descrição (Opcional)</span>
              </Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum (IA gera livremente)</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                      {template.is_default && ' ⭐'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateDescription}
              className="bg-red-600 hover:bg-red-700 w-full"
              disabled={!transcription}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Descrição
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            <p className="text-slate-600">Gerando descrição...</p>
            <p className="text-xs text-slate-400">Isso pode levar alguns segundos</p>
          </div>
        )}

        {description && !isGenerating && (
          <>
            <div className="flex items-center justify-between mb-4">
              {/* Seletor de Versões */}
              {descriptionVersions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <History className="w-4 h-4" />
                      Versão {descriptionVersions.findIndex(v => v.id === selectedVersionId) + 1 || 1} de {descriptionVersions.length}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
                    {descriptionVersions.map((version, idx) => (
                      <DropdownMenuItem
                        key={version.id}
                        onClick={() => {
                          setDescription(version.descricao_completa || '');
                          setSelectedVersionId(version.id);
                        }}
                        className={selectedVersionId === version.id ? 'bg-red-50' : ''}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">Versão {idx + 1}</span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(version.created_date), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDescription(null);
                  setSelectedVersionId(null);
                }}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Gerar Novo
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700">Descrição Gerada</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(description)}
                    className="gap-2"
                  >
                    {copiedItem === 'description' ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {description}
                  </p>
                  <p className="text-xs text-slate-400 mt-3 pt-3 border-t">
                    {description.length} caracteres
                  </p>
                </div>
              </div>

              <Button
                onClick={() => onDescriptionGenerated && onDescriptionGenerated(description)}
                className="bg-green-600 hover:bg-green-700 w-full"
              >
                Usar esta Descrição
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}