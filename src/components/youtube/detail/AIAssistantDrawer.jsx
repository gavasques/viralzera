import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, Library } from "lucide-react";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";

import AIRefineOptionsList from './AIRefineOptionsList';
import AISuggestionCard from './AISuggestionCard';
import AIModelingAnalyzer from './AIModelingAnalyzer';

const SECTION_CONFIG = {
  hook: {
    label: 'Hook',
    options: [
      { action: 'hook_alternatives', label: '3 Hooks Alternativos', icon: '🎯' },
      { action: 'hook_contraintuitivo', label: 'Mais Contraintuitivo', icon: '🔄' },
      { action: 'hook_curiosidade', label: 'Adicionar Curiosidade', icon: '❓' }
    ]
  },
  apresentacao: {
    label: 'Apresentação',
    options: [
      { action: 'apresentacao_pessoal', label: 'Tornar Mais Pessoal', icon: '💬' },
      { action: 'apresentacao_credibilidade', label: 'Adicionar Credibilidade', icon: '🏆' },
      { action: 'apresentacao_encurtar', label: 'Encurtar', icon: '✂️' }
    ]
  },
  ponte: {
    label: 'Ponte',
    options: [
      { action: 'ponte_expectativa', label: 'Criar Mais Expectativa', icon: '⚡' },
      { action: 'ponte_conectar_hook', label: 'Conectar Melhor com Hook', icon: '🔗' },
      { action: 'ponte_promessa', label: 'Adicionar Promessa', icon: '🎁' }
    ]
  },
  corpo: {
    label: 'Corpo',
    options: [
      { action: 'corpo_psp', label: 'Aplicar Técnica PSP', icon: '🔁' },
      { action: 'corpo_topicos', label: 'Adicionar Mais Tópicos', icon: '➕' },
      { action: 'corpo_transicoes', label: 'Melhorar Transições', icon: '🌊' }
    ]
  },
  resumo: {
    label: 'Resumo',
    options: [
      { action: 'resumo_pontos_chave', label: 'Reforçar Pontos-Chave', icon: '📌' },
      { action: 'resumo_urgencia', label: 'Criar Urgência', icon: '⏰' },
      { action: 'resumo_conectar_cta', label: 'Conectar com CTA', icon: '🔗' }
    ]
  },
  cta: {
    label: 'CTA',
    options: [
      { action: 'cta_alternatives', label: '5 CTAs Diferentes', icon: '🎯' },
      { action: 'cta_persuasivo', label: 'Mais Persuasivo', icon: '💪' },
      { action: 'cta_urgencia', label: 'Senso de Urgência', icon: '🔥' }
    ]
  }
};

export default function AIAssistantDrawer({ 
  open, 
  onOpenChange, 
  sectionKey, 
  sectionContent,
  scriptData,
  sections,
  modelingIds,
  onReplace,
  onInsertBelow
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showModelingAnalyzer, setShowModelingAnalyzer] = useState(false);

  const config = SECTION_CONFIG[sectionKey];

  const handleRefine = async (action) => {
    setIsLoading(true);
    setSelectedAction(action);
    setSuggestions(null);
    setAnalysis(null);

    try {
      const context = {
        title: scriptData?.title || '',
        videoType: scriptData?.video_type || '',
        hookContent: sections?.hook || '',
        ctaContent: sections?.cta || '',
        resumoContent: sections?.resumo || '',
        sectionName: config?.label || ''
      };

      const response = await neon.functions.invoke('youtubeScriptRefiner', {
        action,
        content: sectionContent,
        context
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao refinar');
      }

      setSuggestions(response.data.data.suggestions || []);
      setAnalysis(response.data.data.analysis || null);

    } catch (error) {
      console.error('Refine error:', error);
      toast.error(error.message || 'Erro ao gerar sugestões');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelingAnalysis = async (modelingContent) => {
    setIsLoading(true);
    setSelectedAction('analyze_modeling');
    setSuggestions(null);
    setAnalysis(null);
    setShowModelingAnalyzer(false);

    try {
      const context = {
        title: scriptData?.title || '',
        videoType: scriptData?.video_type || '',
        sectionName: config?.label || ''
      };

      const response = await neon.functions.invoke('youtubeScriptRefiner', {
        action: 'analyze_modeling',
        content: sectionContent,
        context,
        modelingData: modelingContent
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao analisar');
      }

      setSuggestions(response.data.data.suggestions || []);
      setAnalysis(response.data.data.analysis || null);

    } catch (error) {
      console.error('Modeling analysis error:', error);
      toast.error(error.message || 'Erro ao analisar modelagens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSuggestions(null);
    setAnalysis(null);
    setSelectedAction(null);
    setShowModelingAnalyzer(false);
  };

  const handleReplace = (content) => {
    onReplace(sectionKey, content);
    toast.success('Conteúdo substituído!');
  };

  const handleInsertBelow = (content) => {
    onInsertBelow(sectionKey, content);
    toast.success('Conteúdo inserido!');
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Assistente de IA - {config?.label}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Modeling Analyzer Button */}
            {modelingIds?.length > 0 && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
                onClick={() => setShowModelingAnalyzer(true)}
              >
                <Library className="w-4 h-4" />
                Analisar Modelagens ({modelingIds.length})
              </Button>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <p className="text-sm text-slate-500">Gerando sugestões...</p>
              </div>
            )}

            {/* Options List */}
            {!isLoading && !suggestions && !showModelingAnalyzer && (
              <AIRefineOptionsList 
                options={config?.options || []} 
                onSelect={handleRefine}
              />
            )}

            {/* Modeling Analyzer */}
            {showModelingAnalyzer && !isLoading && (
              <AIModelingAnalyzer
                modelingIds={modelingIds}
                onAnalyze={handleModelingAnalysis}
                onCancel={() => setShowModelingAnalyzer(false)}
              />
            )}

            {/* Analysis */}
            {analysis && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 mb-1">Análise das Modelagens:</p>
                <p className="text-sm text-blue-700">{analysis}</p>
              </div>
            )}

            {/* Suggestions */}
            {suggestions && suggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">Sugestões</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSuggestions(null);
                      setSelectedAction(null);
                      setAnalysis(null);
                    }}
                  >
                    Voltar às opções
                  </Button>
                </div>
                
                {suggestions.map((suggestion, index) => (
                  <AISuggestionCard
                    key={index}
                    title={suggestion.title}
                    content={suggestion.content}
                    onCopy={() => {
                      navigator.clipboard.writeText(suggestion.content);
                      toast.success('Copiado!');
                    }}
                    onReplace={() => handleReplace(suggestion.content)}
                    onInsertBelow={() => handleInsertBelow(suggestion.content)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}