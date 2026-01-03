import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Youtube, ArrowRight, ArrowLeft, Sparkles, Check, Lightbulb, Video, Users, Library } from "lucide-react";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

import { StepTema } from "./steps/StepTema";
import { StepCreativeDirective } from "./steps/StepCreativeDirective";
import { StepVideoType } from "./steps/StepVideoType";
import { StepContext } from "./steps/StepContext";
import { StepUserContent } from "./steps/StepUserContent";
import { buildYoutubePrompt } from "./buildYoutubePrompt";
import { sendMessage } from "@/components/services/OpenRouterDirectService";
import { Target } from "lucide-react";

const STEPS = [
  { id: 'tema', title: 'Tema Central', description: 'Assunto do vídeo', icon: Lightbulb },
  { id: 'directive', title: 'Diretriz Criativa', description: 'Estratégia do vídeo', icon: Target },
  { id: 'type', title: 'Tipo de Vídeo', description: 'Formato do conteúdo', icon: Video },
  { id: 'context', title: 'Contexto', description: 'Persona e Público', icon: Users },
  { id: 'userContent', title: 'Conteúdo Padrão', description: 'Intro e CTA', icon: Library },
];

const INITIAL_FORM_DATA = {
  tema: '',
  videoTypeId: '',
  videoType: '',
  videoTypePrompt: '',
  personaId: '',
  audienceId: '',
  selectedMaterials: [],
  selectedModelings: [],
  introductionId: null,
  ctaId: null,
  userNotes: '',
  duracaoEstimada: ''
};

export default function YoutubeScriptWizardModal({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { selectedFocusId } = useSelectedFocus();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setFormData(INITIAL_FORM_DATA);
      setIsGenerating(false);
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // 1. Buscar configurações dos agentes (refinador e gerador) em paralelo
      const [refinerConfigs, generatorConfigs] = await Promise.all([
        base44.entities.YoutubePromptRefinerConfig.filter({}),
        base44.entities.YoutubeGeneratorConfig.filter({})
      ]);
      
      const refinerConfig = refinerConfigs[0];
      const agentConfig = generatorConfigs[0];

      if (!agentConfig?.model) {
        throw new Error('Modelo de IA não configurado. Peça ao administrador para configurar em Configurações de Agentes.');
      }

      // 2. Buscar o tipo de roteiro selecionado para pegar o prompt_template
      const scriptType = await base44.entities.YoutubeScriptType.get(formData.videoTypeId);
      if (!scriptType) {
        throw new Error('Tipo de roteiro não encontrado.');
      }

      // 3. Buscar todos os dados necessários em paralelo
      const [persona, audience, materials, introduction, cta] = await Promise.all([
        formData.personaId ? base44.entities.Persona.get(formData.personaId) : null,
        formData.audienceId ? base44.entities.Audience.get(formData.audienceId) : null,
        formData.selectedMaterials?.length > 0 
          ? base44.entities.Material.filter({ id: { $in: formData.selectedMaterials } }) 
          : [],
        formData.introductionId ? base44.entities.UserIntroduction.get(formData.introductionId) : null,
        formData.ctaId ? base44.entities.UserCTA.get(formData.ctaId) : null
      ]);

      // 4. Buscar dossiê da modelagem selecionada
      let dossierContent = '';
      if (formData.selectedModelings?.length > 0) {
        const modelingId = formData.selectedModelings[0];
        const dossiers = await base44.entities.ContentDossier.filter({ modeling_id: modelingId }, '-created_date', 1);
        
        if (!dossiers || dossiers.length === 0 || !dossiers[0].full_content) {
          throw new Error('A modelagem selecionada não possui um Dossiê gerado. Por favor, gere o dossiê antes de criar o roteiro.');
        }
        dossierContent = dossiers[0].full_content;
      }

      // 5. Montar o prompt inicial usando o template do tipo de roteiro
      const initialPrompt = buildYoutubePrompt({
        promptTemplate: scriptType.prompt_template,
        tema: formData.tema,
        persona,
        audience,
        dossierContent,
        introduction,
        cta,
        userNotes: formData.userNotes,
        duracaoEstimada: formData.duracaoEstimada,
        videoType: scriptType.title,
        creativeDirective: formData.creativeDirective
      });

      // 6. ETAPA DE REFINAMENTO: Se o refinador estiver configurado, refinar o prompt antes de gerar
      let finalPrompt = initialPrompt;
      
      if (refinerConfig?.model && refinerConfig?.prompt) {
        console.log('Refinando prompt com agente YoutubePromptRefiner...');
        
        const refinerResponse = await sendMessage({
          model: refinerConfig.model,
          messages: [
            { role: 'system', content: refinerConfig.prompt },
            { role: 'user', content: initialPrompt }
          ],
          options: {
            enableReasoning: refinerConfig.enable_reasoning || false,
            reasoningEffort: refinerConfig.reasoning_effort || 'medium',
            enableWebSearch: refinerConfig.enable_web_search || false,
            feature: 'YoutubePromptRefiner'
          }
        });
        
        finalPrompt = refinerResponse.content;
        console.log('Prompt refinado com sucesso!');
      }

      // 7. Chamar OpenRouter para gerar o roteiro final
      const aiResponse = await sendMessage({
        model: agentConfig.model,
        messages: [
          { role: 'system', content: agentConfig.prompt || 'Você é um especialista em criar roteiros para YouTube.' },
          { role: 'user', content: finalPrompt }
        ],
        options: {
          enableReasoning: agentConfig.enable_reasoning || false,
          reasoningEffort: agentConfig.reasoning_effort || 'medium',
          enableWebSearch: agentConfig.enable_web_search || false,
          feature: 'YoutubeScriptGenerator'
        }
      });

      const generatedContent = aiResponse.content;

      // 8. Criar registro do YoutubeScript
      const newScript = await base44.entities.YoutubeScript.create({
        title: formData.tema.substring(0, 100),
        video_type: scriptType.title,
        corpo: generatedContent,
        duracao_estimada: formData.duracaoEstimada || null,
        status: 'Rascunho',
        focus_id: selectedFocusId,
        modeling_ids: formData.selectedModelings || []
      });

      // 9. Salvar histórico inicial no chat para continuação
      try {
        await Promise.all([
          base44.entities.YoutubeScriptChat.create({
            script_id: newScript.id,
            role: 'user',
            content: finalPrompt
          }),
          base44.entities.YoutubeScriptChat.create({
            script_id: newScript.id,
            role: 'assistant',
            content: generatedContent,
            usage: aiResponse.usage
          })
        ]);
      } catch (chatError) {
        console.error("Erro ao salvar histórico do chat:", chatError);
        // Não impede o fluxo principal, apenas loga o erro
      }

      onOpenChange(false);
      toast.success('Roteiro criado com sucesso!');
      navigate(createPageUrl(`YoutubeScriptDetail?id=${newScript.id}`));

    } catch (error) {
      console.error("Error generating youtube script:", error);
      toast.error(error.message || 'Erro ao gerar roteiro. Tente novamente.');
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepTema focusId={selectedFocusId} value={formData} onChange={setFormData} />;
      case 1:
        return <StepCreativeDirective focusId={selectedFocusId} value={formData} onChange={setFormData} />;
      case 2:
        return <StepVideoType focusId={selectedFocusId} value={formData} onChange={setFormData} />;
      case 3:
        return <StepContext focusId={selectedFocusId} value={formData} onChange={setFormData} />;
      case 4:
        return <StepUserContent focusId={selectedFocusId} value={formData} onChange={setFormData} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return formData.tema?.trim().length > 0;
    if (currentStep === 2) return !!formData.videoTypeId;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-white h-[85vh] max-h-[750px] flex flex-row" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Criar Roteiro para YouTube</DialogTitle>
        
        {/* Sidebar Steps */}
        <div className="w-[280px] bg-slate-50 border-r border-slate-100 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-red-600 p-1.5 rounded-lg shadow-sm">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">YouTube Script</span>
            </div>

            <div className="space-y-1 relative">
              {/* Connector Line */}
              <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200 z-0" />
              
              {STEPS.map((step, idx) => {
                const isActive = currentStep === idx;
                const isCompleted = currentStep > idx;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="relative z-10 flex items-center gap-3 py-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                      isActive 
                        ? "bg-red-600 border-red-600 text-white scale-110" 
                        : isCompleted 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "bg-white border-slate-200 text-slate-400"
                    )}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className={cn(
                        "font-semibold text-sm transition-colors",
                        isActive ? "text-red-900" : isCompleted ? "text-slate-900" : "text-slate-500"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-400">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
            <p className="text-xs text-red-800 font-medium mb-1">💡 Dica Pro</p>
            <p className="text-xs text-red-600/80 leading-relaxed">
              Quanto mais contexto você fornecer (persona, público, materiais), mais personalizado será seu roteiro.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header (Mobile Only) */}
          <div className="md:hidden p-4 border-b flex items-center gap-2 bg-slate-50">
            <span className="font-bold text-slate-900">Passo {currentStep + 1} de {STEPS.length}</span>
            <span className="text-slate-400"> - {STEPS[currentStep].title}</span>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              {renderStep()}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
            <Button 
              variant="ghost" 
              onClick={handleBack} 
              disabled={currentStep === 0}
              className={cn("text-slate-500", currentStep === 0 && "invisible")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!canProceed() || isGenerating}
                className={cn(
                  "min-w-[140px] shadow-lg transition-all",
                  currentStep === STEPS.length - 1 
                    ? "bg-red-600 hover:bg-red-700 hover:scale-[1.02]" 
                    : "bg-slate-900 hover:bg-slate-800"
                )}
              >
                {currentStep === STEPS.length - 1 ? (
                  isGenerating ? (
                    <span className="text-xs animate-pulse">Gerando roteiro...</span>
                  ) : (
                    <>
                      Gerar Roteiro
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  )
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}