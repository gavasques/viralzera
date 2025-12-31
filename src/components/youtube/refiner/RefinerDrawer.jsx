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
      
      // Buscar dados de modelagem se ativado
      let modelings = [];
      if (useModelings && modelingIds?.length > 0) {
        const [videos, texts, mainModelings] = await Promise.all([
          base44.entities.ModelingVideo.filter({ modeling_id: { $in: modelingIds } }),
          base44.entities.ModelingText.filter({ modeling_id: { $in: modelingIds } }),
          base44.entities.Modeling.filter({ id: { $in: modelingIds } })
        ]);
        
        // Combinar dados
        modelings = mainModelings.map(m => ({
          title: m.title,
          creator_idea: m.creator_idea,
          transcript: videos.find(v => v.modeling_id === m.id)?.transcript,
          content: texts.find(t => t.modeling_id === m.id)?.content
        }));
        setModelingData(modelings);
      }

      const response = await base44.functions('youtubeScriptRefiner', {
        action: option.id,
        actionPrompt: option.prompt,
        content: sectionContent,
        sectionKey: sectionKey,
        context: scriptContext,
        modelingData: modelings
      });

      if (response.data?.success) {
        setSuggestions(response.data.suggestions || []);
      } else {
        console.error('Refiner error:', response.data?.error);
      }
    } catch (error) {
      console.error('Error calling refiner:', error);
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