import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Database } from "lucide-react";
import { getRefinerOptions } from './refinerConfig';
import RefinerOptionButton from './RefinerOptionButton';
import RefinerSuggestionCard from './RefinerSuggestionCard';
import RefinerModelingSection from './RefinerModelingSection';
import { AGENT_CONFIGS } from '@/components/constants/agentConfigs';
import { toast } from "sonner";

export default function RefinerDrawer({
  open,
  onOpenChange,
  sectionKey,
  sectionContent,
  scriptContext,
  modelingIds,
  onReplace,
  onInsertBelow
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [useModelings, setUseModelings] = useState(false);
  const [modelingData, setModelingData] = useState([]);

  const sectionConfig = getRefinerOptions(sectionKey);

  const handleOptionClick = async (option) => {
    setSelectedOption(option);
    setSuggestions([]);
    setIsLoading(true);

    try {
      const { base44 } = await import('@/api/base44Client');
      
      // 1. Get User API Key
      const userConfigs = await base44.entities.UserConfig.list();
      const apiKey = userConfigs[0]?.openrouter_api_key;

      if (!apiKey) {
        toast.error('Configure sua API Key do OpenRouter em Configurações');
        setIsLoading(false);
        return;
      }

      // 2. Get Refiner Config
      const refinerConfigs = await base44.entities.YoutubeRefinerConfig.list();
      const config = refinerConfigs?.[0];

      // 3. Get Dossiers if enabled
      let modelingsContext = "";
      if (useModelings && modelingIds?.length > 0) {
        // Fetch dossiers linked to the modelings
        const dossiers = await base44.entities.ContentDossier.filter({ modeling_id: { $in: modelingIds } });
        
        if (dossiers.length > 0) {
          modelingsContext = "\n\nDOSSIÊS DE REFERÊNCIA (USE ESTE CONTEÚDO PARA GUIAR O ESTILO E TEMA):\n";
          dossiers.forEach((d, idx) => {
             // Using full_content from ContentDossier
             // Limit context to avoid hitting token limits too hard, but give enough info
             const contentSnippet = d.full_content.length > 15000 
               ? d.full_content.substring(0, 15000) + "...(troncado)" 
               : d.full_content;
               
             modelingsContext += `\n--- DOSSIÊ ${idx + 1} ---\n${contentSnippet}\n`;
          });
        } else {
           // Fallback to modelings if no dossier found? 
           // User explicitly asked for Dossier. If no dossier, maybe just warn or do nothing.
           // For now, let's keep it empty if no dossier found to respect "use Dossier".
           console.log("Nenhum dossiê encontrado para as modelagens vinculadas.");
        }
      }

      // 4. Build System Prompt
      const systemPrompt = config?.prompt || AGENT_CONFIGS.youtubeScriptRefiner.defaultPrompt;
      const fullSystemPrompt = `${systemPrompt}\n\nINSTRUÇÃO DE FORMATO: Você DEVE retornar APENAS um JSON válido contendo um array de strings chamado "suggestions". Exemplo: { "suggestions": ["Sugestão 1...", "Sugestão 2..."] }. Não inclua markdown, apenas o JSON puro.`;

      // 5. Build User Prompt
      const userPrompt = `
CONTEXTO DO ROTEIRO:
Título: ${scriptContext?.title || 'Sem título'}
Tipo: ${scriptContext?.videoType || 'Não especificado'}

SEÇÃO ATUAL (${sectionKey}):
"${sectionContent}"

AÇÃO DE REFINAMENTO:
${option.prompt}

${modelingsContext}

Gere 3 sugestões refinadas seguindo as instruções acima.`;

      // 6. Call OpenRouter Direct
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ContentAI - Refiner'
        },
        body: JSON.stringify({
          model: config?.model || 'openai/gpt-4o-mini', // Default fallback
          messages: [
            { role: 'system', content: fullSystemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: config?.max_tokens || 32000,
          response_format: { type: "json_object" } 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) throw new Error('Resposta vazia da IA');

      // 7. Parse Response
      let parsedSuggestions = [];
      try {
        const json = JSON.parse(content);
        if (Array.isArray(json.suggestions)) {
          parsedSuggestions = json.suggestions;
        } else if (Array.isArray(json)) {
          parsedSuggestions = json; // Fallback if returns array directly
        } else {
           // Fallback textual parsing if JSON structure is unexpected
           console.warn('Estrutura JSON inesperada:', json);
           parsedSuggestions = [content];
        }
      } catch (e) {
        console.warn('Falha ao parsear JSON, usando texto bruto:', e);
        // Tentar extrair lista de texto se falhar o JSON
        parsedSuggestions = [content];
      }

      setSuggestions(parsedSuggestions);

    } catch (error) {
      console.error('Error calling refiner:', error);
      toast.error(`Erro ao refinar: ${error.message}`);
      setSuggestions([]); // Clear on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplace = (suggestion) => {
    onReplace(sectionKey, suggestion);
    onOpenChange(false);
  };

  const handleInsertBelow = (suggestion) => {
    onInsertBelow(sectionKey, suggestion);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setSuggestions([]);
      setSelectedOption(null);
    }, 300);
  };

  if (!sectionConfig) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Refinar {sectionConfig.title}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Modelagem Toggle */}
            {modelingIds?.length > 0 && (
              <RefinerModelingSection
                enabled={useModelings}
                onToggle={setUseModelings}
                modelingCount={modelingIds.length}
              />
            )}

            {/* Opções de Refinamento */}
            {!selectedOption && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700">
                  Escolha uma ação de refinamento:
                </h4>
                {sectionConfig.options.map((option) => (
                  <RefinerOptionButton
                    key={option.id}
                    option={option}
                    onClick={() => handleOptionClick(option)}
                    disabled={isLoading}
                  />
                ))}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm text-slate-500">
                  Gerando sugestões com IA...
                </p>
              </div>
            )}

            {/* Sugestões */}
            {selectedOption && !isLoading && suggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-700">
                    Sugestões para "{selectedOption.label}":
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedOption(null);
                      setSuggestions([]);
                    }}
                  >
                    ← Voltar
                  </Button>
                </div>

                {suggestions.map((suggestion, index) => (
                  <RefinerSuggestionCard
                    key={index}
                    index={index}
                    suggestion={suggestion}
                    onReplace={() => handleReplace(suggestion)}
                    onInsertBelow={() => handleInsertBelow(suggestion)}
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