import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { sendMessage } from "@/components/services/OpenRouterDirectService";
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
  RefreshCw
} from "lucide-react";

export default function YoutubeKitModal({ open, onOpenChange, scriptContent, scriptTitle }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [kit, setKit] = useState(null);
  const [copiedItem, setCopiedItem] = useState(null);

  const generateKit = async () => {
    if (!scriptContent) {
      toast.error('O roteiro precisa ter conteúdo para gerar o kit');
      return;
    }

    setIsGenerating(true);
    try {
      // Buscar configuração do agente
      const configs = await base44.entities.YoutubeKitGeneratorConfig.filter({});
      const config = configs[0];

      if (!config?.model) {
        throw new Error('Configure o agente "YouTube - Gerador de Kit" em Configurações de Agentes');
      }

      // Preparar prompt com substituição do placeholder
      let systemPrompt = config.prompt || '';
      systemPrompt = systemPrompt.replace('{{roteiro_final}}', scriptContent);

      const response = await sendMessage({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Gere o kit completo de publicação para o seguinte roteiro:\n\n${scriptContent}` }
        ],
        options: {
          enableReasoning: config.enable_reasoning || false,
          reasoningEffort: config.reasoning_effort || 'medium',
          enableWebSearch: config.enable_web_search || false,
          feature: 'YoutubeKitGenerator'
        }
      });

      // Parse JSON da resposta
      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsedKit = JSON.parse(jsonMatch[0]);
        setKit(parsedKit);
        toast.success('Kit gerado com sucesso!');
      } else {
        throw new Error('Resposta não contém JSON válido');
      }
    } catch (err) {
      console.error('Error generating kit:', err);
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
          <div className="flex flex-col items-center justify-center py-12 gap-4">
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
            <Button 
              onClick={generateKit} 
              className="bg-red-600 hover:bg-red-700 mt-2"
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
            <div className="flex justify-end mb-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateKit}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerar
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
                  {kit.titulos?.map((titulo, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-red-200 transition-colors"
                    >
                      <span className="text-sm text-slate-800">{titulo}</span>
                      <CopyButton text={titulo} itemId={`titulo-${idx}`} />
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="thumbnails" className="mt-0 space-y-3">
                  <p className="text-sm text-slate-500 mb-3">
                    Ideias de conceitos visuais para sua thumbnail
                  </p>
                  {kit.ideias_thumbnail?.map((ideia, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="bg-red-100 text-red-700 font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{ideia}</p>
                        </div>
                        <CopyButton text={ideia} itemId={`thumb-${idx}`} />
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="descricao" className="mt-0">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-500">
                      Descrição otimizada para SEO
                    </p>
                    <CopyButton text={kit.descricao_completa} itemId="descricao" />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {kit.descricao_completa}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="tags" className="mt-0">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-500">
                      Tags otimizadas para SEO do YouTube
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(kit.tags_seo?.join(', '), 'all-tags')}
                      className="gap-2"
                    >
                      {copiedItem === 'all-tags' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copiar todas
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {kit.tags_seo?.map((tag, idx) => (
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
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}