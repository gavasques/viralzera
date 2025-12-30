import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ArrowLeft, Wand2, Check, MessageSquare, Users, Bot, Library } from "lucide-react";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { StepPostType } from "./steps/StepPostType";
import { StepContext } from "./steps/StepContext";
import { StepRefinement } from "./steps/StepRefinement";
import { StepModel } from "./steps/StepModel";
import { StepName } from "@/components/titanos/multiscript/steps/StepName";

const STEPS = [
  { id: 'name', title: 'Nome', description: 'Identificação do script', icon: MessageSquare },
  { id: 'format', title: 'Formato', description: 'Tipo de conteúdo', icon: Wand2 },
  { id: 'context', title: 'Contexto', description: 'Persona e Público', icon: Users },
  { id: 'model', title: 'Inteligência', description: 'Modelo e Recursos', icon: Bot },
  { id: 'refine', title: 'Refinamento', description: 'Materiais e Notas', icon: Library },
];

const INITIAL_FORM_DATA = {
  title: '',
  postTypeId: '',
  includeExamples: true,
  personaId: '',
  audienceId: '',
  selectedMaterials: [],
  userNotes: '',
  model: '',
  modelName: '',
  enableReasoning: false,
  reasoningEffort: 'medium',
  enableWebSearch: false
};

export default function ScriptWizardModal({ open, onOpenChange, onCreate }) {
  const { selectedFocusId } = useSelectedFocus();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Reset form when modal opens
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
      const [postType, persona, audience, materials] = await Promise.all([
        formData.postTypeId ? base44.entities.PostType.get(formData.postTypeId) : null,
        formData.personaId ? base44.entities.Persona.get(formData.personaId) : null,
        formData.audienceId ? base44.entities.Audience.get(formData.audienceId) : null,
        formData.selectedMaterials.length > 0 
          ? base44.entities.Material.filter({ id: { $in: formData.selectedMaterials } }) 
          : []
      ]);

      // 2. Build Prompt
      const prompt = buildPrompt({ 
        postType: postType?.data || postType, // Handle potential response wrapper
        persona: persona?.data || persona,
        audience: audience?.data || audience,
        materials: Array.isArray(materials) ? materials : (materials?.data || []),
        includeExamples: formData.includeExamples,
        userNotes: formData.userNotes
      });

      // 3. Call onCreate
      await onCreate({
        title: formData.title || `Script: ${(postType?.data || postType)?.title || 'Novo'}`,
        post_type_id: formData.postTypeId,
        include_examples: formData.includeExamples,
        persona_id: formData.personaId || null,
        audience_id: formData.audienceId || null,
        material_ids: formData.selectedMaterials,
        initialMessage: prompt,
        // Model Config
        model: formData.model,
        model_name: formData.modelName,
        enable_reasoning: formData.enableReasoning,
        reasoning_effort: formData.reasoningEffort,
        enable_web_search: formData.enableWebSearch
      });

      // 4. Close
      onOpenChange(false);
      
      // Reset handled by useEffect when modal closes

    } catch (error) {
      console.error("Error generating script:", error);
      setIsGenerating(false);
    }
  };

  // Render Step Content
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepName value={formData} onChange={setFormData} />;
      case 1:
        return <StepPostType focusId={selectedFocusId} value={formData} onChange={setFormData} />;
      case 2:
        return <StepContext focusId={selectedFocusId} value={formData} onChange={setFormData} />;
      case 3:
        return <StepModel value={formData} onChange={setFormData} />;
      case 4:
        return <StepRefinement focusId={selectedFocusId} value={formData} onChange={setFormData} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return formData.title?.trim().length > 0;
    if (currentStep === 1) return !!formData.postTypeId;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-white h-[600px] flex flex-row">
        
        {/* Sidebar Steps */}
        <div className="w-[280px] bg-slate-50 border-r border-slate-100 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-8">
            <div className="flex items-center gap-2 mb-8">
               <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
                 <Wand2 className="w-5 h-5 text-white" />
               </div>
               <span className="font-bold text-lg text-slate-900 tracking-tight">Gerador</span>
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
                        ? "bg-indigo-600 border-indigo-600 text-white scale-110" 
                        : isCompleted 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "bg-white border-slate-200 text-slate-400"
                    )}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className={cn(
                        "font-semibold text-sm transition-colors",
                        isActive ? "text-indigo-900" : isCompleted ? "text-slate-900" : "text-slate-500"
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

          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
             <p className="text-xs text-indigo-800 font-medium mb-1">Dica Pro</p>
             <p className="text-xs text-indigo-600/80 leading-relaxed">
               Quanto mais informações de contexto (persona e materiais) você fornecer, mais autêntico será o resultado.
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
                      ? "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]" 
                      : "bg-slate-900 hover:bg-slate-800"
                 )}
               >
                 {currentStep === STEPS.length - 1 ? (
                   isGenerating ? (
                     <span className="text-xs animate-pulse">Estamos analisando e melhorando sua solicitação...</span>
                   ) : (
                     <>
                       Gerar Script
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

// Prompt Builder Logic
function buildPrompt({ postType, persona, audience, materials, includeExamples, userNotes }) {
  let prompt = `Olá! Preciso que você me ajude a criar um script magnético.\n\n`;
    
  // Post Type Info
  if (postType) {
    prompt += `📝 **TIPO DE POSTAGEM:**\n`;
    prompt += `- Nome: ${postType.title || 'N/A'}\n`;
    prompt += `- Formato: ${postType.format || 'N/A'}\n`;
    if (postType.character_limit) prompt += `- Limite de Caracteres: ${postType.character_limit}\n`;
    if (postType.description) prompt += `- Descrição/Objetivo: ${postType.description}\n`;
    if (postType.content_structure) prompt += `- Estrutura de Conteúdo:\n${postType.content_structure}\n`;
    if (postType.creation_instructions) prompt += `- Instruções de Criação:\n${postType.creation_instructions}\n`;

    // Examples
    if (includeExamples && postType.examples?.length > 0) {
      prompt += `\n📚 **EXEMPLOS DE REFERÊNCIA:**\n`;
      prompt += `Seguem exemplos desse formato, alguns feitos por mim e outros que tiveram sucesso:\n\n`;
      postType.examples.slice(0, 5).forEach((ex, i) => {
        const content = typeof ex === 'string' ? ex : ex.content;
        const sourceType = typeof ex === 'string' ? '' : (ex.source_type === 'mine' ? ' (Meu)' : ' (Referência)');
        prompt += `--- Exemplo ${i + 1}${sourceType} ---\n${content}\n\n`;
      });
    }
  }

  // Persona
  if (persona) {
    prompt += `\n👤 **MINHA PERSONA:**\n`;
    prompt += `- Nome: ${persona.name}\n`;
    if (persona.who_am_i) prompt += `- Quem Sou Eu: ${persona.who_am_i}\n`;
    if (persona.hobbies?.length > 0) {
      const hobbiesText = Array.isArray(persona.hobbies) ? persona.hobbies.join(', ') : persona.hobbies;
      prompt += `- Hobbies e Interesses: ${hobbiesText}\n`;
    }
    // Simplificado para brevidade, mas pode incluir todos os campos se necessário
    if (persona.tone_of_voice) {
      const toneText = typeof persona.tone_of_voice === 'object'
        ? JSON.stringify(persona.tone_of_voice, null, 2)
        : persona.tone_of_voice;
      prompt += `- Tom de Voz: ${toneText}\n`;
    }
  }

  // Audience
  if (audience) {
    prompt += `\n🎯 **PÚBLICO-ALVO:**\n`;
    prompt += `- Nome: ${audience.name}\n`;
    if (audience.funnel_stage) prompt += `- Etapa do Funil: ${audience.funnel_stage}\n`;
    if (audience.description) prompt += `- Descrição: ${audience.description}\n`;
    if (audience.pains) prompt += `- Dores: ${audience.pains}\n`;
    if (audience.ambitions) prompt += `- Ambições: ${audience.ambitions}\n`;
  }

  // Materials
  if (materials && materials.length > 0) {
    prompt += `\n📋 **IDEIAS DO BANCO DE LISTAS:**\n`;
    prompt += `Use estas referências para criar o conteúdo:\n\n`;
    materials.forEach((mat) => {
      prompt += `--- ${mat.title} ---\n${mat.content}\n\n`;
    });
  }

  // User Notes
  if (userNotes && userNotes.trim()) {
    prompt += `\n📝 **NOTAS DO USUÁRIO:**\n`;
    prompt += `O usuário adicionou as seguintes observações e instruções extras:\n`;
    prompt += `"${userNotes}"\n`;
  }

  prompt += `\n---\n\nCom base nessas informações, me ajude a criar um script magnético para este formato. O que você sugere?`;

  return prompt;
}