import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Target, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendMessage } from "@/components/services/OpenRouterDirectService";
import CreativeDirectiveCard from "../CreativeDirectiveCard";

export function StepCreativeDirective({ focusId, value, onChange }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch modelings for this focus
  const { data: modelings = [] } = useQuery({
    queryKey: ['modelings-wizard-directive', focusId],
    queryFn: () => neon.entities.Modeling.filter({ focus_id: focusId }, '-created_date', 50),
    enabled: !!focusId
  });

  // Fetch dossiers
  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers-wizard-directive', focusId],
    queryFn: async () => {
      const allDossiers = await neon.entities.ContentDossier.list('-created_date', 100);
      const modelingIds = modelings.map(m => m.id);
      return allDossiers.filter(d => modelingIds.includes(d.modeling_id));
    },
    enabled: modelings.length > 0
  });

  const currentModelingId = value.selectedModelings?.[0];
  const currentDossier = dossiers.find(d => d.modeling_id === currentModelingId);

  // Initialize history if not present
  const directiveHistory = value.directiveHistory || [];
  const currentHistoryIndex = value.currentHistoryIndex ?? (directiveHistory.length - 1);

  const generateFormatRecommendation = async (directive) => {
    if (!directive) return;

    try {
      // Buscar config do agente e script types em paralelo
      const [agentConfigs, scriptTypes] = await Promise.all([
        neon.entities.YoutubeFormatSelectorConfig.filter({}),
        neon.entities.YoutubeScriptType.filter({ focus_id: focusId }, 'title', 100)
      ]);
      
      const config = agentConfigs[0];
      
      if (!config?.model) {
        console.log('Format selector agent not configured, skipping');
        return;
      }

      // Montar taxonomia dinâmica a partir dos Script Types cadastrados
      const taxonomiaFormatos = scriptTypes.length > 0
        ? scriptTypes.map(t => `- ${t.title}`).join('\n')
        : '- Nenhum tipo cadastrado';

      // Preparar prompt com substituições
      let systemPrompt = config.prompt || `# PROMPT PARA O AGENTE SELETOR DE FORMATO

## SUA IDENTIDADE
Você é um Seletor Inteligente de Formato de Vídeo.

## SUA MISSÃO
Baseado na Diretriz Criativa, escolher o melhor formato de vídeo da nossa taxonomia. Sua resposta DEVE ser um objeto JSON válido.

## TAXONOMIA DE FORMATOS
{{taxonomia_formatos}}

## JSON DE SAÍDA
{
  "formato_recomendado": "Nome exato do formato da taxonomia",
  "justificativa_estrategica": "Explicação de 2-3 frases de por que esse formato é ideal"
}

## DIRETRIZ CRIATIVA PARA ANÁLISE
{{creative_directive_json}}`;

      const directiveJson = JSON.stringify(directive, null, 2);

      // Substituir placeholders
      systemPrompt = systemPrompt
        .replace(/\{\{taxonomia_formatos\}\}/g, taxonomiaFormatos)
        .replace(/\{\{creative_directive_json\}\}/g, directiveJson);

      const response = await sendMessage({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analise a diretriz criativa e recomende o melhor formato da taxonomia acima.` }
        ],
        options: {
          enableReasoning: config.enable_reasoning || false,
          reasoningEffort: config.reasoning_effort || 'medium',
          enableWebSearch: config.enable_web_search || false,
          feature: 'YoutubeFormatSelector'
        }
      });

      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const formatRecommendation = JSON.parse(jsonMatch[0]);
        onChange(prev => ({ 
          ...prev, 
          formatRecommendation 
        }));
      }
    } catch (err) {
      console.error('Error generating format recommendation:', err);
      // Don't show error to user, this is optional
    }
  };

  const generateCreativeDirective = async (userFeedback = '') => {
    if (!currentDossier?.full_content) {
      toast.error('Dossiê sem conteúdo para analisar');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      // Fetch agent config
      const agentConfigs = await neon.entities.YoutubeCreativeDirectiveConfig.filter({});
      const config = agentConfigs[0];
      
      if (!config?.model) {
        throw new Error('Configure o agente "YouTube - Diretriz Criativa" em Configurações de Agentes');
      }

      let systemPrompt = config.prompt || `# PROMPT PARA O AGENTE DE DIRETRIZ CRIATIVA

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

      // Add user feedback to prompt if provided
      if (userFeedback) {
        systemPrompt += `

## FEEDBACK DO USUÁRIO PARA AJUSTE
${userFeedback}

IMPORTANTE: Considere este feedback ao gerar a nova Diretriz Criativa. Ajuste o tom, ângulo ou foco conforme solicitado.`;
      }

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

      // Add to history
      const newHistory = [...directiveHistory, directive];
      const newIndex = newHistory.length - 1;

      onChange({ 
        ...value, 
        creativeDirective: directive,
        directiveHistory: newHistory,
        currentHistoryIndex: newIndex
      });

      toast.success('Diretriz criativa gerada!');

      // Auto-generate format recommendation
      generateFormatRecommendation(directive);
    } catch (err) {
      console.error('Error generating creative directive:', err);
      setError(err.message);
      toast.error('Erro ao gerar diretriz: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVersion = (index) => {
    const selectedDirective = directiveHistory[index];
    if (selectedDirective) {
      onChange({
        ...value,
        creativeDirective: selectedDirective,
        currentHistoryIndex: index
      });
    }
  };

  // Auto-generate on mount if dossiê exists and no directive yet
  useEffect(() => {
    if (currentDossier?.full_content && !value.creativeDirective && !isGenerating && directiveHistory.length === 0) {
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
          directiveHistory={directiveHistory}
          currentHistoryIndex={currentHistoryIndex >= 0 ? currentHistoryIndex : directiveHistory.length - 1}
          isLoading={isGenerating}
          error={error}
          onRegenerate={generateCreativeDirective}
          onSelectVersion={handleSelectVersion}
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