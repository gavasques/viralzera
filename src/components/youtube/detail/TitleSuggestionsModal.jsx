import React, { useState } from 'react';
import { neon } from "@/api/neonClient";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { sendMessage } from "@/components/services/OpenRouterDirectService";

export default function TitleSuggestionsModal({ 
  open, 
  onOpenChange, 
  scriptId, 
  content,
  onTitleSelected 
}) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [titles, setTitles] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const generateTitles = async () => {
    setIsLoading(true);
    setTitles([]);
    setSelectedIndex(null);

    try {
      // 1. Buscar configuração do agente
      const configs = await neon.entities.YoutubeTitleConfig.filter({});
      const config = configs[0];

      const cfg = config?.config || {};
      if (!cfg.model) {
        throw new Error('Modelo de IA não configurado para geração de títulos. Configure em Configurações de Agentes.');
      }

      // 2. Preparar prompt
      const defaultPrompt = `Analise o roteiro de vídeo do YouTube abaixo e sugira 5 títulos magnéticos e chamativos.

Os títulos devem:
- Ser curiosos e gerar cliques
- Ter no máximo 60 caracteres
- Usar gatilhos mentais (curiosidade, urgência, benefício)
- Ser variados em estilo (alguns com números, alguns com perguntas, alguns diretos)

## ROTEIRO:
{{SCRIPT_CONTENT}}

## FORMATO DE RESPOSTA:
Retorne APENAS um JSON válido no formato:
{
  "titles": [
    "Título 1",
    "Título 2",
    "Título 3",
    "Título 4",
    "Título 5"
  ]
}`;

      const systemPrompt = cfg.prompt || defaultPrompt;
      const finalPrompt = systemPrompt.replace('{{SCRIPT_CONTENT}}', content || '(Roteiro vazio)');

      // 3. Chamar IA
      const aiResponse = await sendMessage({
        model: cfg.model,
        messages: [
          { role: 'system', content: 'Você é um especialista em copywriting para YouTube. Retorne apenas JSON.' },
          { role: 'user', content: finalPrompt }
        ],
        options: {
          enableReasoning: cfg.enable_reasoning,
          reasoningEffort: cfg.reasoning_effort,
          enableWebSearch: cfg.enable_web_search,
          maxTokens: cfg.max_tokens || 32000,
          feature: 'YoutubeTitleGenerator'
        }
      });

      // 4. Parsear resposta
      let generatedTitles = [];
      const responseContent = aiResponse.content;
      
      try {
        // Tenta encontrar JSON no texto (caso venha com markdown ```json ... ```)
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseContent;
        
        const parsed = JSON.parse(jsonStr);
        if (parsed.titles && Array.isArray(parsed.titles)) {
          generatedTitles = parsed.titles;
        } else {
           // Fallback se for array direto
           if (Array.isArray(parsed)) generatedTitles = parsed;
        }
      } catch (e) {
        console.warn('Falha ao parsear JSON, tentando extrair linhas', e);
        // Fallback: tenta pegar linhas que parecem títulos (entre aspas ou bullets)
        const lines = responseContent.split('\n');
        generatedTitles = lines
          .filter(l => l.trim().match(/^["\d-]/)) // Começa com aspas, numero ou hifen
          .map(l => l.replace(/^[\d\-\.\s]+/, '').replace(/^"|"$/g, '').trim())
          .filter(l => l.length > 5)
          .slice(0, 5);
      }

      if (generatedTitles.length === 0) {
        throw new Error('Não foi possível interpretar a resposta da IA. Tente novamente.');
      }

      setTitles(generatedTitles);

    } catch (error) {
      console.error('Error generating titles:', error);
      toast.error(error.message || 'Erro ao gerar títulos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTitle = async (title, index) => {
    setSelectedIndex(index);
    setIsSaving(true);

    try {
      await neon.entities.YoutubeScript.update(scriptId, { title });
      queryClient.invalidateQueries({ queryKey: ['youtube-script', scriptId] });
      onTitleSelected(title);
      toast.success('Título atualizado!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Erro ao atualizar título');
    } finally {
      setIsSaving(false);
      setSelectedIndex(null);
    }
  };

  // Gera títulos quando o modal abre
  React.useEffect(() => {
    if (open && titles.length === 0) {
      generateTitles();
    }
  }, [open]);

  // Reset ao fechar
  React.useEffect(() => {
    if (!open) {
      setTitles([]);
      setSelectedIndex(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Sugestões de Títulos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              <p className="text-sm text-slate-500">
                Lendo roteiro e gerando títulos...
              </p>
            </div>
          ) : titles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-slate-500">Nenhum título gerado ainda.</p>
              <Button onClick={generateTitles} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Títulos
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {titles.map((title, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      "hover:bg-slate-50 hover:border-slate-300"
                    )}
                  >
                    <p className="text-sm font-medium text-slate-700 flex-1 pr-3">
                      {title}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUseTitle(title, index)}
                      disabled={isSaving}
                      className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isSaving && selectedIndex === index ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Usar
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateTitles}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Novos Títulos
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}