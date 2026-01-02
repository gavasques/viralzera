import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { sendMessage } from "@/components/services/OpenRouterDirectService";
import CreativeDirectiveCard from "../CreativeDirectiveCard";

export function StepCreativeDirective({ focusId, value, onChange }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch modelings for this focus
  const { data: modelings = [] } = useQuery({
    queryKey: ['modelings-wizard-directive', focusId],
    queryFn: () => base44.entities.Modeling.filter({ focus_id: focusId }, '-created_date', 50),
    enabled: !!focusId
  });

  // Fetch dossiers
  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers-wizard-directive', focusId],
    queryFn: async () => {
      const allDossiers = await base44.entities.ContentDossier.list('-created_date', 100);
      const modelingIds = modelings.map(m => m.id);
      return allDossiers.filter(d => modelingIds.includes(d.modeling_id));
    },
    enabled: modelings.length > 0
  });

  const currentModelingId = value.selectedModelings?.[0];
  const currentDossier = dossiers.find(d => d.modeling_id === currentModelingId);

  const generateCreativeDirective = async () => {
    if (!currentDossier?.full_content) {
      toast.error('Dossiê sem conteúdo para analisar');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      // Fetch agent config
      const agentConfigs = await base44.entities.YoutubeCreativeDirectiveConfig.filter({});
      const config = agentConfigs[0];
      
      if (!config?.model) {
        throw new Error('Configure o agente "YouTube - Diretriz Criativa" em Configurações de Agentes');
      }

      const systemPrompt = config.prompt || `# PROMPT PARA O AGENTE DE DIRETRIZ CRIATIVA

## SUA IDENTIDADE
Você é um Estrategista de Conteúdo Sênior para YouTube.

## SUA MISSÃO
Analisar o dossiê de inteligência e sintetizar a Diretriz Criativa Central para um novo vídeo. Sua resposta DEVE ser um objeto JSON válido.

## REGRAS
- Seja conciso e impactante.
- A resposta deve ser apenas o JSON, sem introduções.

## JSON DE SAÍDA
{
  "tese_principal": "A grande ideia do vídeo em uma frase impactante",
  "grande_porque": "A razão emocional pela qual alguém assistiria este vídeo",
  "angulo_unico": "O que torna essa abordagem diferente de outros vídeos sobre o tema",
  "conflito_central": "A tensão principal que será explorada no vídeo"
}`;

      const finalPrompt = systemPrompt.replace('{{dossier_content}}', currentDossier.full_content);

      const response = await sendMessage({
        model: config.model,
        messages: [
          { role: 'system', content: finalPrompt },
          { role: 'user', content: `Analise o dossiê abaixo e gere a diretriz criativa:\n\n${currentDossier.full_content}` }
        ],
        options: {
          enableReasoning: config.enable_reasoning || false,
          reasoningEffort: config.reasoning_effort || 'medium',
          enableWebSearch: config.enable_web_search || false,
          feature: 'YoutubeCreativeDirective'
        }
      });

      // Parse JSON from response
      const content = response.content;
      let directive;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        directive = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Resposta não contém JSON válido');
      }

      onChange({ 
        ...value, 
        creativeDirective: directive 
      });

      toast.success('Diretriz criativa gerada!');
    } catch (err) {
      console.error('Error generating creative directive:', err);
      setError(err.message);
      toast.error('Erro ao gerar diretriz: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on mount if dossiê exists and no directive yet
  useEffect(() => {
    if (currentDossier?.full_content && !value.creativeDirective && !isGenerating) {
      generateCreativeDirective();
    }
  }, [currentDossier?.id]);

  const hasDossier = !!currentDossier?.full_content;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Target className="w-5 h-5 text-yellow-600" />
          Diretriz Criativa
        </h2>
        <p className="text-sm text-slate-500">
          A IA analisa o dossiê e extrai a estratégia central do vídeo
        </p>
      </div>

      {!hasDossier ? (
        <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
          <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Nenhum dossiê selecionado</p>
          <p className="text-sm text-slate-400 mt-1">
            Volte ao passo anterior e selecione um dossiê com conteúdo gerado
          </p>
        </div>
      ) : (
        <CreativeDirectiveCard 
          directive={value.creativeDirective}
          isLoading={isGenerating}
          error={error}
          onRegenerate={generateCreativeDirective}
        />
      )}

      {hasDossier && !isGenerating && !value.creativeDirective && !error && (
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-2">A diretriz será gerada automaticamente...</p>
        </div>
      )}
    </div>
  );
}