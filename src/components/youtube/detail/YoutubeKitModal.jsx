import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { sendMessage } from "@/components/services/OpenRouterDirectService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Youtube, Copy, Check, Type, Image, FileText, 
  Tags, Sparkles, RefreshCw 
} from "lucide-react";

export default function YoutubeKitModal({ open, onOpenChange, scriptContent, scriptTitle }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [kit, setKit] = useState(null);
  const [copiedItem, setCopiedItem] = useState(null);

  const generateKit = async () => {
    setIsGenerating(true);
    try {
      const configs = await base44.entities.YoutubeKitGeneratorConfig.filter({});
      const config = configs[0];

      if (!config?.model) {
        throw new Error('Configure o agente "YouTube - Gerador de Kit" em Configurações de Agentes');
      }

      const promptWithContent = (config.prompt || '').replace('{{roteiro_final}}', scriptContent);

      const response = await sendMessage({
        model: config.model,
        messages: [
          { role: 'system', content: promptWithContent },
          { role: 'user', content: `Gere o kit completo de publicação para este roteiro:\n\n${scriptContent}` }
        ],
        options: {
          enableReasoning: config.enable_reasoning || false,
          reasoningEffort: config.reasoning_effort || 'medium',
          enableWebSearch: config.enable_web_search || false,
          feature: 'YoutubeKitGenerator'
        }
      });

      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const kitData = JSON.parse(jsonMatch[0]);
        setKit(kitData);
        toast.success('Kit gerado com sucesso!');
      } else {
        throw new Error('Resposta inválida da IA');
      }
    } catch (error) {
      console.error('Error generating kit:', error);
      toast.error(error.message || 'Erro ao gerar kit');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text, itemId) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    toast.success('Copiado!');
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const CopyButton = ({ text, itemId }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, itemId)}
      className="h-7 px-2"
    >
      {copiedItem === itemId ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            Kit de Publicação YouTube
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!kit && !isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 px-4"
            >
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Gerar Kit Completo
              </h3>
              <p className="text-sm text-slate-500 text-center max-w-md mb-6">
                A IA vai analisar seu roteiro e criar títulos otimizados, ideias de thumbnail, 
                descrição completa e tags SEO.
              </p>
              <Button onClick={generateKit} className="bg-red-600 hover:bg-red-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Kit
              </Button>
            </motion.div>
          )}

          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
              <p className="text-slate-600 font-medium">Gerando kit de publicação...</p>
              <p className="text-sm text-slate-400 mt-1">Isso pode levar alguns segundos</p>
            </motion.div>
          )}

          {kit && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <div className="flex justify-end mb-2">
                <Button variant="outline" size="sm" onClick={generateKit}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Regenerar
                </Button>
              </div>

              <Tabs defaultValue="titulos" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="titulos" className="gap-1.5">
                    <Type className="w-3.5 h-3.5" />
                    Títulos
                  </TabsTrigger>
                  <TabsTrigger value="thumbnails" className="gap-1.5">
                    <Image className="w-3.5 h-3.5" />
                    Thumbnails
                  </TabsTrigger>
                  <TabsTrigger value="descricao" className="gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Descrição
                  </TabsTrigger>
                  <TabsTrigger value="tags" className="gap-1.5">
                    <Tags className="w-3.5 h-3.5" />
                    Tags
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto mt-4">
                  {/* Títulos */}
                  <TabsContent value="titulos" className="m-0 space-y-2">
                    <p className="text-sm text-slate-500 mb-3">
                      5 opções de títulos otimizados para CTR e SEO
                    </p>
                    {kit.titulos?.map((titulo, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                      >
                        <span className="text-sm text-slate-800 flex-1">{titulo}</span>
                        <CopyButton text={titulo} itemId={`titulo-${idx}`} />
                      </div>
                    ))}
                  </TabsContent>

                  {/* Thumbnails */}
                  <TabsContent value="thumbnails" className="m-0 space-y-3">
                    <p className="text-sm text-slate-500 mb-3">
                      Conceitos visuais para thumbnail
                    </p>
                    {kit.ideias_thumbnail?.map((ideia, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className="bg-red-100 text-red-600 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-sm text-slate-700">{ideia}</p>
                          </div>
                          <CopyButton text={ideia} itemId={`thumb-${idx}`} />
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  {/* Descrição */}
                  <TabsContent value="descricao" className="m-0">
                    <p className="text-sm text-slate-500 mb-3">
                      Descrição otimizada com resumo, links e timestamps
                    </p>
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                      <div className="flex justify-end mb-2">
                        <CopyButton text={kit.descricao_completa} itemId="descricao" />
                      </div>
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                        {kit.descricao_completa}
                      </pre>
                    </div>
                  </TabsContent>

                  {/* Tags */}
                  <TabsContent value="tags" className="m-0">
                    <p className="text-sm text-slate-500 mb-3">
                      Tags SEO para melhor descobribilidade
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {kit.tags_seo?.map((tag, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary"
                          className="text-sm py-1.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors"
                          onClick={() => copyToClipboard(tag, `tag-${idx}`)}
                        >
                          {copiedItem === `tag-${idx}` ? (
                            <Check className="w-3 h-3 mr-1 text-green-500" />
                          ) : null}
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(kit.tags_seo?.join(', '), 'all-tags')}
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Copiar todas as tags
                    </Button>
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}