import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Youtube, ArrowRight, ArrowLeft, Sparkles, Check, FileText, Video, Users, Bot, Library, Database } from "lucide-react";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

import { StepName } from "./steps/StepName";
import { StepVideoType } from "./steps/StepVideoType";
import { StepContext } from "./steps/StepContext";
import { StepModel } from "./steps/StepModel";
import { StepRefinement } from "./steps/StepRefinement";
import { StepModelings } from "./steps/StepModelings";
import { buildYoutubePrompt, getVideoTypeConfig } from "./buildYoutubePrompt";

const STEPS = [
  { id: 'name', title: 'Nome', description: 'Título do roteiro', icon: FileText },
  { id: 'type', title: 'Tipo de Vídeo', description: 'Formato do conteúdo', icon: Video },
  { id: 'context', title: 'Contexto', description: 'Persona e Público', icon: Users },
  { id: 'modelings', title: 'Modelagens', description: 'Referências de sucesso', icon: Database },
  { id: 'model', title: 'Inteligência', description: 'Modelo e Recursos', icon: Bot },
  { id: 'refine', title: 'Refinamento', description: 'Materiais e Notas', icon: Library },
];

const INITIAL_FORM_DATA = {
  title: '',
  videoType: '',
  personaId: '',
  audienceId: '',
  selectedMaterials: [],
  selectedModelings: [],
  userNotes: '',
  duracaoEstimada: '',
  model: '',
  modelName: '',
  enableReasoning: false,
  reasoningEffort: 'medium',
  enableWebSearch: false
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
      // 1. Fetch full data needed for prompt
      const [persona, audience, materials] = await Promise.all([
        formData.personaId ? base44.entities.Persona.get(formData.personaId) : null,
        formData.audienceId ? base44.entities.Audience.get(formData.audienceId) : null,
        formData.selectedMaterials.length > 0 
          ? base44.entities.Material.filter({ id: { $in: formData.selectedMaterials } }) 
          : []
      ]);

      // 2. Fetch modelings content if selected
      let modelingsContent = [];
      if (formData.selectedModelings?.length > 0) {
        const [modelingsData, videos, texts] = await Promise.all([
          base44.entities.Modeling.filter({ id: { $in: formData.selectedModelings } }),
          base44.entities.ModelingVideo.filter({ 
            modeling_id: { $in: formData.selectedModelings },
            status: 'transcribed'
          }),
          base44.entities.ModelingText.filter({ 
            modeling_id: { $in: formData.selectedModelings }
          })
        ]);

        modelingsContent = modelingsData.map(m => ({
          title: m.title,
          creatorIdea: m.creator_idea,
          transcripts: videos
            .filter(v => v.modeling_id === m.id)
            .map(v => ({ title: v.title, content: v.transcript })),
          texts: texts
            .filter(t => t.modeling_id === m.id)
            .map(t => ({ title: t.title, content: t.content }))
        }));
      }

      // 3. Build prompt
      const prompt = buildYoutubePrompt({
        videoType: formData.videoType,
        title: formData.title,
        persona: persona?.data || persona,
        audience: audience?.data || audience,
        materials: Array.isArray(materials) ? materials : (materials?.data || []),
        userNotes: formData.userNotes,
        modelingsContent
      });

      // 3. Call AI via backend function
      const aiResponse = await base44.functions.invoke('youtubeScriptGenerator', {
        prompt: prompt,
        model: formData.model,
        enableReasoning: formData.enableReasoning,
        reasoningEffort: formData.reasoningEffort,
        enableWebSearch: formData.enableWebSearch
      });

      if (!aiResponse.data?.success) {
        throw new Error(aiResponse.data?.error || 'Erro ao gerar roteiro');
      }

      const generatedContent = aiResponse.data.content;

      // 4. Get video type config for duration
      const videoTypeConfig = getVideoTypeConfig(formData.videoType);

      // 5. Create YoutubeScript record
      await base44.entities.YoutubeScript.create({
        title: formData.title,
        video_type: formData.videoType,
        corpo: generatedContent,
        duracao_estimada: formData.duracaoEstimada || null,
        status: 'Rascunho',
        focus_id: selectedFocusId,
        modeling_ids: formData.selectedModelings || []
      });

      // 6. Close modal and redirect
      onOpenChange(false);
      toast.success('Roteiro criado com sucesso!');
      navigate(createPageUrl('YoutubeScripts'));

    } catch (error) {
      console.error("Error generating youtube script:", error);
      toast.error(error.message || 'Erro ao gerar roteiro. Tente novamente.');
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepName value={formData} onChange={setFormData} />;
      case 1:
        return <StepVideoType value={formData} onChange={setFormData} />;
      case 2:
        return <StepContext focusId={selectedFocusId} value={formData} onChange={setFormData} />;
      case 3:
        return <StepModelings focusId={selectedFocusId} value={formData} onChange={setFormData} />;
      case 4:
        return <StepModel value={formData} onChange={setFormData} />;
      case 5:
        return <StepRefinement focusId={selectedFocusId} value={formData} onChange={setFormData} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return formData.title?.trim().length > 0;
    if (currentStep === 1) return !!formData.videoType;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-white h-[600px] flex flex-row">
        
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