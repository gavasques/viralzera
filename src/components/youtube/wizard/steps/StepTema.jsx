import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Database, Sparkles, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { sendMessage } from "@/components/services/OpenRouterDirectService";
import CreativeDirectiveCard from "../CreativeDirectiveCard";

export function StepTema({ focusId, value, onChange }) {
  const [isGeneratingDirective, setIsGeneratingDirective] = useState(false);
  const [directiveError, setDirectiveError] = useState(null);

  // Fetch modelings for selector
  const { data: modelings = [] } = useQuery({
    queryKey: ['modelings-wizard-tema', focusId],
    queryFn: () => base44.entities.Modeling.filter({ focus_id: focusId }, '-created_date', 50),
    enabled: !!focusId
  });

  // Fetch dossiers
  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers-wizard', focusId],
    queryFn: async () => {
      const allDossiers = await base44.entities.ContentDossier.list('-created_date', 100);
      // Filter by modelings from this focus
      const modelingIds = modelings.map(m => m.id);
      return allDossiers.filter(d => modelingIds.includes(d.modeling_id));
    },
    enabled: modelings.length > 0
  });

  const generateCreativeDirective = async (dossierContent) => {
    setIsGeneratingDirective(true);
    setDirectiveError(null);
    
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

      const finalPrompt = systemPrompt.replace('{{dossier_content}}', dossierContent);

      const response = await sendMessage({
        model: config.model,
        messages: [
          { role: 'system', content: finalPrompt },
          { role: 'user', content: `Analise o dossiê abaixo e gere a diretriz criativa:\n\n${dossierContent}` }
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
      
      // Try to extract JSON from response
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
    } catch (error) {
      console.error('Error generating creative directive:', error);
      setDirectiveError(error.message);
      toast.error('Erro ao gerar diretriz: ' + error.message);
    } finally {
      setIsGeneratingDirective(false);
    }
  };

  const handleModelingChange = async (modelingId) => {
    if (modelingId === 'none') {
      onChange({ 
        ...value, 
        selectedModelings: [],
        creativeDirective: null
      });
      return;
    }

    const selectedModeling = modelings.find(m => m.id === modelingId);
    if (selectedModeling) {
      const idea = selectedModeling.creator_idea;
      const title = selectedModeling.title;
      
      // Use creator_idea if available, otherwise title
      const newTema = idea || title || value.tema;
      
      onChange({ 
        ...value, 
        tema: newTema,
        selectedModelings: [modelingId],
        creativeDirective: null
      });

      if (idea) {
        toast.success("Tema preenchido com a Ideia do Criador do Dossiê");
      } else {
        toast.info("Tema preenchido com o título da Modelagem");
      }

      // Check if there's a dossier for this modeling
      const dossier = dossiers.find(d => d.modeling_id === modelingId);
      if (dossier?.full_content) {
        generateCreativeDirective(dossier.full_content);
      }
    }
  };

  const handleRegenerateDirective = () => {
    const currentModelingId = value.selectedModelings?.[0];
    if (currentModelingId) {
      const dossier = dossiers.find(d => d.modeling_id === currentModelingId);
      if (dossier?.full_content) {
        generateCreativeDirective(dossier.full_content);
      }
    }
  };

  const currentModelingId = value.selectedModelings?.[0] || '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="space-y-3 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-bold text-indigo-900">
              Carregar do Dossiê (Modelagem)
            </Label>
            <p className="text-xs text-indigo-700/80 leading-relaxed">
              Selecione um dossiê existente para carregar a "Ideia do Criador" como tema e usar os materiais analisados como referência.
            </p>
          </div>
        </div>
        
        <Select 
          value={currentModelingId} 
          onValueChange={handleModelingChange}
        >
          <SelectTrigger className="bg-white border-indigo-200 focus:ring-indigo-500 h-10">
            <SelectValue placeholder="Selecione um dossiê..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Começar do zero --</SelectItem>
            {modelings.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Tema Central do Vídeo
          </Label>
          <p className="text-sm text-slate-500">
            Descreva sobre o que será o vídeo ou refine a ideia importada do dossiê.
          </p>
        </div>

        <Textarea
          value={value.tema || ''}
          onChange={(e) => onChange({ ...value, tema: e.target.value })}
          placeholder="Ex: Como ganhar dinheiro vendendo na Amazon FBA em 2024..."
          className="min-h-[140px] text-base resize-none p-4 shadow-sm border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
          autoFocus
        />
      </div>

      <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
        <Sparkles className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Dica Pro:</strong> A IA usará este tema junto com os materiais da modelagem selecionada para criar um roteiro único. Você pode editar o tema livremente acima.
        </p>
      </div>
    </div>
  );
}