import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { neon } from "@/api/neonClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/components/services/OpenRouterDirectService";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { toast } from "sonner";
import { 
  Loader2, 
  Sparkles, 
  Type, 
  Image, 
  FileText, 
  Tags, 
  Copy, 
  Check,
  RefreshCw,
  FileCode,
  History,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

export default function YoutubeKitModal({ open, onOpenChange, scriptContent, scriptTitle, scriptId }) {
  const { selectedFocusId } = useSelectedFocus();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [kit, setKit] = useState(null);
  const [copiedItem, setCopiedItem] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState(null);

  // Buscar versões salvas do kit
  const { data: kitVersions = [], isLoading: isLoadingVersions, refetch: refetchVersions } = useQuery({
    queryKey: ['youtube-kit-versions', scriptId],
    queryFn: () => neon.entities.YoutubeKitVersion.filter(
      { script_id: scriptId },
      '-created_date'
    ),
    enabled: open && !!scriptId
  });

  // Carregar última versão ao abrir (apenas se já terminou de buscar e tem versões)
  useEffect(() => {
    if (open && !isLoadingVersions && kitVersions.length > 0 && !kit && !selectedVersionId) {
      const latestVersion = kitVersions[0];
      setKit({
        titulos: latestVersion.titulos || [],
        ideias_thumbnail: latestVersion.ideias_thumbnail || [],
        descricao_completa: latestVersion.descricao_completa || '',
        tags_seo: latestVersion.tags_seo || []
      });
      setSelectedVersionId(latestVersion.id);
    }
  }, [open, kitVersions, kit, selectedVersionId, isLoadingVersions]);

  // Buscar templates de descrição
  const { data: templates = [] } = useQuery({
    queryKey: ['description-templates', selectedFocusId],
    queryFn: () => neon.entities.DescriptionTemplate.filter(
      selectedFocusId ? { focus_id: selectedFocusId } : {},
      '-created_date'
    ),
    enabled: open
  });

  // Buscar blocos de descrição
  const { data: blocks = [] } = useQuery({
    queryKey: ['description-blocks', selectedFocusId],
    queryFn: () => neon.entities.DescriptionBlock.filter(
      selectedFocusId ? { focus_id: selectedFocusId } : {},
      'title'
    ),
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
      setKit(null);
      setSelectedTemplateId('');
      setSelectedVersionId(null);
    }
  }, [open]);

  /**
   * Processa o template substituindo placeholders de blocos
   */
  const processBlockPlaceholders = (templateContent) => {
    let processed = templateContent;
    
    // Regex para encontrar {{bloco:slug}}
    const blockRegex = /\{\{bloco:([a-z0-9_]+)\}\}/gi;
    
    processed = processed.replace(blockRegex, (match, slug) => {
      const block = blocks.find(b => b.slug.toLowerCase() === slug.toLowerCase());
      if (block) {
        return block.content;
      }
      return `[Bloco não encontrado: ${slug}]`;
    });
    
    return processed;
  };

  const generateKit = async () => {
    if (!scriptContent) {
      toast.error('O roteiro precisa ter conteúdo para gerar o kit');
      return;
    }

    setIsGenerating(true);
    try {
      // Buscar configuração do agente
      const configs = await neon.entities.YoutubeKitGeneratorConfig.filter({});
      const config = configs[0];

      if (!config?.model) {
        throw new Error('Configure o agente "YouTube - Gerador de Kit" em Configurações de Agentes');
      }

      // Buscar template selecionado
      let templateContent = '';
      if (selectedTemplateId) {
        const template = await neon.entities.DescriptionTemplate.get(selectedTemplateId);
        if (template) {
          // Processa os blocos dentro do template
          templateContent = processBlockPlaceholders(template.content);
        }
      }

      // Preparar prompt - NÃO substituir placeholders no system prompt
      // Os placeholders serão enviados na mensagem do usuário com os valores reais
      let systemPrompt = config.prompt || '';
      
      // Remover placeholders do system prompt (serão enviados na mensagem do usuário)
      systemPrompt = systemPrompt
        .replace(/## ROTEIRO PARA ANÁLISE[\s\S]*?(?=##|$)/gi, '')
        .replace(/## TEMPLATE DE DESCRIÇÃO[\s\S]*?(?=##|$)/gi, '')
        .replace(/\{\{roteiro_final\}\}/gi, '')
        .replace(/\{\{template_descricao\}\}/gi, '');

      // Construir mensagem do usuário com os dados reais
      let userMessage = `## ROTEIRO PARA ANÁLISE\n\n${scriptContent}`;
      
      if (templateContent && selectedTemplateId && selectedTemplateId !== 'none') {
        userMessage += `\n\n---\n\n## TEMPLATE DE DESCRIÇÃO (use este template como base, substitua os placeholders {{resumo_video}}, {{timestamps}} e {{tags}} pelos valores gerados)\n\n${templateContent}`;
      } else {
        userMessage += `\n\n---\n\nNenhum template selecionado. Gere a descrição livremente, otimizada para SEO do YouTube.`;
      }
      
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
          maxTokens: config.max_tokens || 32000,
          feature: 'YoutubeKitGenerator'
        }
      });

      // Parse JSON da resposta
      const content = response.content;
      
      // Tenta encontrar JSON na resposta - pega o JSON mais externo
      let jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
      let jsonStr = jsonMatch ? jsonMatch[1] : null;
      
      if (!jsonStr) {
        // Tenta encontrar JSON sem code block
        jsonMatch = content.match(/\{[\s\S]*\}/);
        jsonStr = jsonMatch ? jsonMatch[0] : null;
      }
      
      if (jsonStr) {
        const parsedKit = JSON.parse(jsonStr);
        
        // Normalizar nomes de propriedades (IA pode usar variações)
        let rawThumbnails = parsedKit.ideias_thumbnail || parsedKit.thumbnails || parsedKit.thumbnail_ideas || parsedKit.ideias_thumbnails || parsedKit.ideas_thumbnail || [];

        const normalizedKit = {
          titulos: parsedKit.titulos || parsedKit.titles || parsedKit.titulo || [],
          ideias_thumbnail: [],
          descricao_completa: parsedKit.descricao_completa || parsedKit.descricao || parsedKit.description || parsedKit.desc || parsedKit.full_description || parsedKit.descricao_final || '',
          tags_seo: parsedKit.tags_seo || parsedKit.tags || parsedKit.keywords || parsedKit.seo_tags || []
        };

        // Garantir que arrays são arrays
        if (!Array.isArray(normalizedKit.titulos)) {
          normalizedKit.titulos = normalizedKit.titulos ? [normalizedKit.titulos] : [];
        }

        // Normalizar thumbnails para array de strings
        if (!Array.isArray(rawThumbnails)) {
          rawThumbnails = rawThumbnails ? [rawThumbnails] : [];
        }
        normalizedKit.ideias_thumbnail = rawThumbnails.map(item => {
          if (typeof item === 'string') return item;
          // Se for objeto, extrair texto/descrição
          return item?.texto || item?.text || item?.descricao || item?.description || item?.idea || JSON.stringify(item);
        });

        if (!Array.isArray(normalizedKit.tags_seo)) {
          normalizedKit.tags_seo = typeof normalizedKit.tags_seo === 'string' 
            ? normalizedKit.tags_seo.split(',').map(t => t.trim()) 
            : [];
        }
        
        setKit(normalizedKit);
        
        // Salvar versão no banco
        if (scriptId) {
          try {
            const savedVersion = await neon.entities.YoutubeKitVersion.create({
              script_id: scriptId,
              titulos: normalizedKit.titulos,
              ideias_thumbnail: normalizedKit.ideias_thumbnail,
              descricao_completa: normalizedKit.descricao_completa,
              tags_seo: normalizedKit.tags_seo,
              template_id: selectedTemplateId !== 'none' ? selectedTemplateId : null
            });
            setSelectedVersionId(savedVersion.id);
            queryClient.invalidateQueries({ queryKey: ['youtube-kit-versions', scriptId] });
          } catch (saveError) {
            // Silently fail - kit was still generated successfully
          }
        }
        
        toast.success('Kit gerado com sucesso!');
      } else {
        throw new Error('Resposta não contém JSON válido');
      }
    } catch (err) {
      toast.error('Erro ao gerar kit: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text, itemId) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    toast.success('Copiado!');
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const CopyButton = ({ text, itemId }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={() => copyToClipboard(text, itemId)}
    >
      {copiedItem === itemId ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-slate-400" />
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            Kit YouTube
          </DialogTitle>
        </DialogHeader>

        {!kit && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-8 gap-6">
            <div className="bg-red-50 p-4 rounded-full">
              <Sparkles className="w-10 h-10 text-red-500" />
            </div>
            
            <div className="text-center">
              <h3 className="font-semibold text-lg text-slate-900 mb-1">Gerar Kit de Publicação</h3>
              <p className="text-sm text-slate-500 max-w-md">
                A IA irá analisar seu roteiro e gerar títulos otimizados, ideias de thumbnail, 
                descrição completa e tags SEO.
              </p>
            </div>

            {/* Mostrar kits anteriores se existirem */}
            {kitVersions.length > 0 && (
              <div className="w-full max-w-md p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {kitVersions.length} kit(s) gerado(s) anteriormente
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const latestVersion = kitVersions[0];
                      setKit({
                        titulos: latestVersion.titulos || [],
                        ideias_thumbnail: latestVersion.ideias_thumbnail || [],
                        descricao_completa: latestVersion.descricao_completa || '',
                        tags_seo: latestVersion.tags_seo || []
                      });
                      setSelectedVersionId(latestVersion.id);
                    }}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    Ver Último Kit
                  </Button>
                </div>
              </div>
            )}

            {/* Template Selection */}
            <div className="w-full max-w-md space-y-2">
              <Label className="flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Template de Descrição
              </Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (IA gera livremente)</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                      {template.is_default && ' ⭐'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                {templates.length === 0 
                  ? 'Nenhum template cadastrado. Crie em Conteúdo Padrão > Templates.'
                  : 'O template define a estrutura da descrição com seus blocos personalizados.'
                }
              </p>
            </div>

            <Button 
              onClick={generateKit} 
              className="bg-red-600 hover:bg-red-700 mt-2"
              disabled={!scriptContent}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Kit Agora
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            <p className="text-slate-600">Gerando kit de publicação...</p>
            <p className="text-xs text-slate-400">Isso pode levar alguns segundos</p>
          </div>
        )}

        {kit && !isGenerating && (
          <>
            <div className="flex items-center justify-between mb-2">
              {/* Seletor de Versões */}
              {kitVersions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <History className="w-4 h-4" />
                      Versão {kitVersions.findIndex(v => v.id === selectedVersionId) + 1 || 1} de {kitVersions.length}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
                    {kitVersions.map((version, idx) => (
                      <DropdownMenuItem
                        key={version.id}
                        onClick={() => {
                          setKit({
                            titulos: version.titulos || [],
                            ideias_thumbnail: version.ideias_thumbnail || [],
                            descricao_completa: version.descricao_completa || '',
                            tags_seo: version.tags_seo || []
                          });
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
                  setKit(null);
                  setSelectedVersionId(null);
                }}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Gerar Novo
              </Button>
            </div>

            <Tabs defaultValue="titulos" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="titulos" className="gap-1.5">
                  <Type className="w-4 h-4" />
                  <span className="hidden sm:inline">Títulos</span>
                </TabsTrigger>
                <TabsTrigger value="thumbnails" className="gap-1.5">
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline">Thumbnails</span>
                </TabsTrigger>
                <TabsTrigger value="descricao" className="gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Descrição</span>
                </TabsTrigger>
                <TabsTrigger value="tags" className="gap-1.5">
                  <Tags className="w-4 h-4" />
                  <span className="hidden sm:inline">Tags</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="titulos" className="mt-0 space-y-2">
                  <p className="text-sm text-slate-500 mb-3">
                    Clique para copiar o título desejado
                  </p>
                  {kit.titulos?.length > 0 ? (
                    kit.titulos.map((titulo, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-red-200 transition-colors"
                      >
                        <span className="text-sm text-slate-800">{titulo}</span>
                        <CopyButton text={titulo} itemId={`titulo-${idx}`} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">Nenhum título foi gerado</p>
                  )}
                </TabsContent>

                <TabsContent value="thumbnails" className="mt-0 space-y-3">
                  <p className="text-sm text-slate-500 mb-3">
                    Ideias de conceitos visuais para sua thumbnail
                  </p>
                  {kit.ideias_thumbnail?.length > 0 ? (
                    kit.ideias_thumbnail.map((ideia, idx) => {
                      // Garantir que ideia é string
                      const ideiaText = typeof ideia === 'string' ? ideia : (ideia?.texto || ideia?.text || JSON.stringify(ideia));
                      return (
                        <div 
                          key={idx}
                          className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3">
                              <div className="bg-red-100 text-red-700 font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                                {idx + 1}
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{ideiaText}</p>
                            </div>
                            <CopyButton text={ideiaText} itemId={`thumb-${idx}`} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-400 italic">Nenhuma ideia de thumbnail foi gerada</p>
                  )}
                </TabsContent>

                <TabsContent value="descricao" className="mt-0">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-500">
                      Descrição otimizada para SEO
                    </p>
                    {kit.descricao_completa && (
                      <CopyButton text={kit.descricao_completa} itemId="descricao" />
                    )}
                  </div>
                  {kit.descricao_completa ? (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {kit.descricao_completa}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Nenhuma descrição foi gerada</p>
                  )}
                </TabsContent>

                <TabsContent value="tags" className="mt-0">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-500">
                      Tags otimizadas para SEO do YouTube
                    </p>
                    {kit.tags_seo?.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(kit.tags_seo.join(', '), 'all-tags')}
                        className="gap-2"
                      >
                        {copiedItem === 'all-tags' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        Copiar todas
                      </Button>
                    )}
                  </div>
                  {kit.tags_seo?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {kit.tags_seo.map((tag, idx) => (
                        <Badge 
                          key={idx}
                          variant="secondary"
                          className="px-3 py-1.5 text-sm cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                          onClick={() => copyToClipboard(tag, `tag-${idx}`)}
                        >
                          {copiedItem === `tag-${idx}` ? (
                            <Check className="w-3 h-3 mr-1 text-green-500" />
                          ) : null}
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Nenhuma tag foi gerada</p>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}