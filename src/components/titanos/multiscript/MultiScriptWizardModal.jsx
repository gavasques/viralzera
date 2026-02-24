import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ArrowLeft, Wand2, Check, MessageSquare, Users, Bot, Library, Loader2 } from "lucide-react";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { neon, callFunction } from "@/api/neonClient";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Reutilizar steps do ScriptWizard
import { StepPostType } from "@/components/script/wizard/steps/StepPostType";
import { StepContext } from "@/components/script/wizard/steps/StepContext";
import { StepRefinement } from "@/components/script/wizard/steps/StepRefinement";

// Steps específicos do MultiScript
import { StepName } from "./steps/StepName";
import { StepModels } from "./steps/StepModels";
import GenerationLoadingScreen from "./GenerationLoadingScreen";

const STEPS = [
    { id: 'name', title: 'Nome', description: 'Identificação do chat', icon: MessageSquare },
    { id: 'format', title: 'Formato', description: 'Tipo de conteúdo', icon: Wand2 },
    { id: 'context', title: 'Contexto', description: 'Persona e Público', icon: Users },
    { id: 'models', title: 'Inteligências', description: 'Modelos de IA', icon: Bot },
    { id: 'refine', title: 'Refinamento', description: 'Materiais e Notas', icon: Library },
];

export default function MultiScriptWizardModal({ open, onOpenChange, onCreate }) {
    const { selectedFocusId } = useSelectedFocus();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');

    const [formData, setFormData] = useState({
        // Step 1: Nome
        title: '',
        // Step 2: Formato
        postTypeId: '',
        includeExamples: true,
        // Step 3: Contexto
        personaId: '',
        audienceId: '',
        // Step 4: Modelos
        selectedModels: [], // Array of model IDs
        // Step 5: Refinamento
        selectedMaterials: [],
        userNotes: '',
        themeId: ''
    });

    // Reset form when opening
    React.useEffect(() => {
        if (open) {
            setCurrentStep(0);
            setFormData({
                title: `Multi Script - ${new Date().toLocaleDateString('pt-BR')}`,
                postTypeId: '',
                includeExamples: true,
                personaId: '',
                audienceId: '',
                selectedModels: [],
                selectedMaterials: [],
                userNotes: '',
                themeId: ''
            });
            setIsGenerating(false);
            setGenerationStatus('');
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

    const canProceed = () => {
        switch (currentStep) {
            case 0: return formData.title.trim().length > 0;
            case 1: return !!formData.postTypeId;
            case 2: return true; // Contexto é opcional
            case 3: return formData.selectedModels.length > 0;
            case 4: return true; // Refinamento é opcional
            default: return true;
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationStatus('Coletando informações...');

        try {
            // 1. Fetch RefinerConfig
            const refinerConfigs = await neon.entities.RefinerConfig.list();
            const refinerConfig = refinerConfigs?.[0];

            // 2. Fetch all required data
            const [postType, persona, audience, materials, approvedModels, theme, allThemes] = await Promise.all([
                formData.postTypeId ? neon.entities.PostType.get(formData.postTypeId) : null,
                formData.personaId ? neon.entities.Persona.get(formData.personaId) : null,
                formData.audienceId ? neon.entities.Audience.get(formData.audienceId) : null,
                formData.selectedMaterials.length > 0 
                    ? neon.entities.Material.filter({ id: { $in: formData.selectedMaterials } }) 
                    : [],
                neon.entities.ApprovedModel.filter({ is_active: true }),
                formData.themeId ? neon.entities.Theme.get(formData.themeId) : null,
                formData.themeId ? neon.entities.Theme.filter({ focus_id: selectedFocusId }) : []
            ]);

            setGenerationStatus('Construindo prompt...');

            // Build theme with hierarchy
            let themeData = theme?.data || theme;
            let themeHierarchy = null;
            if (themeData && allThemes.length > 0) {
                const themeMap = {};
                allThemes.forEach(t => { themeMap[t.id] = t; });
                
                let path = [themeData.title];
                let current = themeData;
                while (current?.parent_id) {
                    const parent = themeMap[current.parent_id];
                    if (parent) {
                        path.unshift(parent.title);
                        current = parent;
                    } else break;
                }
                themeHierarchy = path.join(' > ');
            }

            // 3. Build raw prompt with collected data
            const rawPrompt = buildPrompt({
                postType: postType?.data || postType,
                persona: persona?.data || persona,
                audience: audience?.data || audience,
                materials: Array.isArray(materials) ? materials : (materials?.data || []),
                includeExamples: formData.includeExamples,
                userNotes: formData.userNotes,
                theme: themeData,
                themeHierarchy
            });

            // 4. Refine prompt via Webhook OR Refiner Agent
            let prompt = rawPrompt;
            let webhookPayloadForLog = null;
            let webhookResponseForLog = null;
            
            // Priority 1: Use webhook if configured
            if (refinerConfig?.webhook_url) {
                setGenerationStatus('Refinando prompt via webhook...');
                
                try {
                    const webhookPayload = {
                        rawPrompt,
                        postType: postType?.data || postType,
                        persona: persona?.data || persona,
                        audience: audience?.data || audience,
                        materials: Array.isArray(materials) ? materials : (materials?.data || []),
                        userNotes: formData.userNotes,
                        includeExamples: formData.includeExamples,
                        theme: themeData,
                        themeHierarchy
                    };
                    
                    // Save payload for log
                    webhookPayloadForLog = webhookPayload;
                    
                    // Call webhook directly (n8n must have CORS enabled)
                    const webhookResponse = await fetch(refinerConfig.webhook_url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(webhookPayload)
                    });
                    
                    if (!webhookResponse.ok) {
                        throw new Error(`Webhook error: ${webhookResponse.status}`);
                    }
                    
                    const webhookText = await webhookResponse.text();
                    const webhookData = webhookText ? JSON.parse(webhookText) : null;
                    
                    // Save raw response for log
                    webhookResponseForLog = webhookData;
                    
                    // Process webhook response
                    try {
                        let webhookJson = typeof webhookData === 'string' ? JSON.parse(webhookData) : webhookData;
                        
                        // Handle array response (e.g., from n8n)
                        if (Array.isArray(webhookJson) && webhookJson.length > 0) {
                            webhookJson = webhookJson[0];
                        }
                        
                        // Extract the prompt text - handle nested "text" field with JSON string
                        if (webhookJson.text && typeof webhookJson.text === 'string') {
                            try {
                                const nestedJson = JSON.parse(webhookJson.text);
                                // Build prompt from prompts array if exists
                                if (nestedJson.prompts && Array.isArray(nestedJson.prompts)) {
                                    prompt = nestedJson.prompts.map(p => 
                                        `### ${p.name || 'PROMPT'}\n${p.prompt}`
                                    ).join('\n\n---\n\n');
                                    
                                    // Add content plan if exists
                                    if (nestedJson.contentPlan) {
                                        prompt += `\n\n### PLANO DE CONTEÚDO\n${JSON.stringify(nestedJson.contentPlan, null, 2)}`;
                                    }
                                    
                                    // Add constraints if exists
                                    if (nestedJson.hardConstraints && Array.isArray(nestedJson.hardConstraints)) {
                                        prompt += `\n\n### RESTRIÇÕES\n${nestedJson.hardConstraints.map(c => `- ${c}`).join('\n')}`;
                                    }
                                } else {
                                    prompt = webhookJson.text;
                                }
                            } catch {
                                prompt = webhookJson.text;
                            }
                        } else {
                            prompt = webhookJson.prompt || webhookJson.refinedPrompt || webhookJson.output || webhookText;
                        }
                    } catch {
                        prompt = typeof webhookData === 'string' ? webhookData : JSON.stringify(webhookData);
                    }
                    
                    if (prompt && prompt.trim()) {
                        console.log('Prompt refinado via webhook com sucesso');
                    } else {
                        throw new Error('Webhook retornou resposta vazia');
                    }
                } catch (webhookError) {
                    console.warn('Falha no webhook, tentando refinador interno:', webhookError);
                    // Fall back to internal refiner or raw prompt
                }
            }
            
            // Priority 2: Use internal refiner if webhook not configured or failed
            if (prompt === rawPrompt && refinerConfig?.model && refinerConfig?.prompt) {
                setGenerationStatus('Refinando prompt com IA...');
                
                try {
                    // Replace {USER_DATA} placeholder with raw prompt
                    const systemPrompt = refinerConfig.prompt.replace('{USER_DATA}', rawPrompt);
                    
                    const refinerBody = {
                        model: refinerConfig.model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: rawPrompt }
                        ],
                    };

                    if (refinerConfig.enable_reasoning && refinerConfig.model?.includes('claude')) {
                        refinerBody.reasoning = { effort: refinerConfig.reasoning_effort || 'medium' };
                    }

                    const refinerData = await callFunction('openrouter', refinerBody);
                    const refinerResult = {
                        content: refinerData.choices?.[0]?.message?.content || '',
                        usage: refinerData.usage || {},
                    };
                    
                    if (refinerResult.content) {
                        prompt = refinerResult.content;
                        console.log('Prompt refinado com sucesso');
                    }
                } catch (refineError) {
                    console.warn('Falha ao refinar prompt, usando prompt original:', refineError);
                    // Continue with raw prompt if refinement fails
                }
            }

            setGenerationStatus('Criando conversa...');

            // 4. Create the conversation with prompt log
            // formData.selectedModels contém recordIds (IDs únicos do ApprovedModel)
            const promptLog = {
                rawPrompt: rawPrompt,
                webhookPayload: webhookPayloadForLog,
                webhookResponse: webhookResponseForLog,
                refinedPrompt: prompt !== rawPrompt ? prompt : null,
                finalPrompt: prompt,
                refinerModel: refinerConfig?.model_name || refinerConfig?.model || null,
            };

            const postTypeData = postType?.data || postType;
            const conversation = await neon.entities.TitanosConversation.create({
                title: formData.title || `Multi Script - ${new Date().toLocaleDateString('pt-BR')}`,
                selected_models: formData.selectedModels, // recordIds
                metrics: {},
                source: 'multiscript_wizard',
                post_type_id: formData.postTypeId,
                persona_id: formData.personaId || null,
                audience_id: formData.audienceId || null,
                prompt_log: promptLog,
                post_channel: postTypeData?.channel || null,
                post_format: postTypeData?.format || null
            });

            // 5. Save user message
            await neon.entities.TitanosMessage.create({
                conversation_id: conversation.id,
                role: 'user',
                content: prompt,
                model_id: null,
            });

            setGenerationStatus('Enviando para IAs...');

            // 6. Build model info map (recordId -> ApprovedModel)
            const modelMap = {};
            approvedModels.forEach(am => {
                modelMap[am.id] = am;
            });

            // 7. Call each model in parallel
            const results = await Promise.allSettled(
                formData.selectedModels.map(async (recordId) => {
                    const modelInfo = modelMap[recordId];
                    if (!modelInfo) {
                        throw new Error(`Modelo não encontrado: ${recordId}`);
                    }

                    const openRouterId = modelInfo.model_id;

                    const modelBody = {
                        model: openRouterId,
                        messages: [{ role: 'user', content: prompt }],
                    };

                    if (modelInfo.supports_reasoning && openRouterId?.includes('claude')) {
                        modelBody.reasoning = { effort: modelInfo.reasoning_effort || 'high' };
                    }

                    if (modelInfo.supports_web_search) {
                        modelBody.plugins = [{ id: 'web' }];
                    }

                    const modelData = await callFunction('openrouter', modelBody);
                    const result = {
                        content: modelData.choices?.[0]?.message?.content || '',
                        usage: modelData.usage || {},
                    };

                    // Save response with recordId
                    await neon.entities.TitanosMessage.create({
                        conversation_id: conversation.id,
                        role: 'assistant',
                        content: result.content,
                        model_id: recordId, // Salva com recordId!
                        metrics: {
                            prompt_tokens: result.usage?.prompt_tokens || 0,
                            completion_tokens: result.usage?.completion_tokens || 0,
                            total_tokens: result.usage?.total_tokens || 0,
                        },
                    });

                    return { recordId, success: true };
                })
            );

            // Count results
            const failures = results.filter(r => r.status === 'rejected' || !r.value?.success);
            const successes = results.length - failures.length;

            if (successes === 0) {
                toast.error('Falha em todos os modelos');
                setIsGenerating(false);
                setGenerationStatus('');
                return;
            }

            if (failures.length > 0) {
                toast.warning(`${failures.length} modelo(s) falharam`);
            }

            // Show optimization animation step
            setGenerationStatus('Otimizando seu conteúdo...');
            
            // Wait for animation to show
            await new Promise(resolve => setTimeout(resolve, 4000));

            toast.success('Multi Script gerado com sucesso!');

            // Invalida a lista de conversas para atualizar o sidebar
            queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });

            if (onCreate) {
                onCreate(conversation);
            }

            onOpenChange(false);

        } catch (error) {
            console.error("Error generating multi script:", error);
            toast.error('Erro ao gerar Multi Script: ' + (error.message || 'Erro desconhecido'));
            setIsGenerating(false);
            setGenerationStatus('');
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <StepName value={formData} onChange={setFormData} />;
            case 1:
                return <StepPostType focusId={selectedFocusId} value={formData} onChange={setFormData} />;
            case 2:
                return <StepContext focusId={selectedFocusId} value={formData} onChange={setFormData} />;
            case 3:
                return <StepModels value={formData} onChange={setFormData} />;
            case 4:
                return <StepRefinement focusId={selectedFocusId} value={formData} onChange={setFormData} />;
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden bg-white h-[800px] flex flex-row">
                
                {/* Sidebar Steps */}
                <div className="w-[260px] bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 p-5 flex flex-col justify-between hidden md:flex">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-pink-600 p-1.5 rounded-lg shadow-sm">
                                <Wand2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg text-slate-900 tracking-tight">Multi Script</span>
                        </div>

                        <div className="space-y-0.5 relative">
                            {/* Connector Line */}
                            <div className="absolute left-[17px] top-5 bottom-5 w-0.5 bg-slate-200 z-0" />
                            
                            {STEPS.map((step, idx) => {
                                const isActive = currentStep === idx;
                                const isCompleted = currentStep > idx;
                                const Icon = step.icon;

                                return (
                                    <div key={step.id} className="relative z-10 flex items-center gap-3 py-2.5">
                                        <div className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                                            isActive 
                                                ? "bg-pink-600 border-pink-600 text-white scale-110" 
                                                : isCompleted 
                                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                                    : "bg-white border-slate-200 text-slate-400"
                                        )}>
                                            {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "font-semibold text-sm transition-colors",
                                                isActive ? "text-pink-900" : isCompleted ? "text-slate-900" : "text-slate-500"
                                            )}>
                                                {step.title}
                                            </p>
                                            <p className="text-[10px] text-slate-400">{step.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-pink-50/80 rounded-xl p-4 border border-pink-100">
                        <p className="text-xs text-pink-800 font-medium mb-1">💡 Multi Script</p>
                        <p className="text-[11px] text-pink-600/80 leading-relaxed">
                            Compare scripts gerados por diferentes IAs para escolher o melhor resultado.
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {/* Generation Loading Screen */}
                    <GenerationLoadingScreen 
                        isGenerating={isGenerating} 
                        currentStatus={generationStatus} 
                    />

                    {/* Header (Mobile Only) */}
                    <div className="md:hidden p-4 border-b flex items-center gap-2 bg-slate-50">
                        <span className="font-bold text-slate-900">Passo {currentStep + 1} de {STEPS.length}</span>
                        <span className="text-slate-400"> - {STEPS[currentStep].title}</span>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="max-w-2xl mx-auto">
                            {renderStep()}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 border-t border-slate-100 bg-white flex justify-between items-center">
                        <Button 
                            variant="ghost" 
                            onClick={handleBack} 
                            disabled={currentStep === 0 || isGenerating}
                            className={cn("text-slate-500", currentStep === 0 && "invisible")}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>

                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleNext} 
                                disabled={!canProceed() || isGenerating}
                                className={cn(
                                    "min-w-[160px] shadow-lg transition-all",
                                    currentStep === STEPS.length - 1 
                                        ? "bg-pink-600 hover:bg-pink-700 hover:scale-[1.02]" 
                                        : "bg-slate-900 hover:bg-slate-800"
                                )}
                            >
                                {isGenerating ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-xs truncate max-w-[120px]">{generationStatus}</span>
                                    </span>
                                ) : currentStep === STEPS.length - 1 ? (
                                    <>
                                        Gerar Multi Script
                                        <Sparkles className="w-4 h-4 ml-2" />
                                    </>
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

// Prompt Builder (similar to ScriptWizardModal but adapted)
function buildPrompt({ postType, persona, audience, materials, includeExamples, userNotes, theme, themeHierarchy }) {
    let prompt = `Preciso que você crie um script magnético com base nas informações abaixo.\n\n`;
    
    // Post Type Info
    if (postType) {
        prompt += `📝 **TIPO DE POSTAGEM:**\n`;
        prompt += `- Nome: ${postType.title || 'N/A'}\n`;
        prompt += `- Formato: ${postType.format || 'N/A'}\n`;
        if (postType.character_limit) prompt += `- Limite de Caracteres: ${postType.character_limit}\n`;
        if (postType.description) prompt += `- Descrição/Objetivo: ${postType.description}\n`;
        if (postType.content_structure) prompt += `- Estrutura de Conteúdo:\n${postType.content_structure}\n`;
        if (postType.creation_instructions) prompt += `- Instruções de Criação:\n${postType.creation_instructions}\n`;

        if (includeExamples && postType.examples?.length > 0) {
            prompt += `\n📚 **EXEMPLOS DE REFERÊNCIA:**\n`;
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
        prompt += `\n📋 **MATERIAIS DE APOIO:**\n`;
        materials.forEach((mat) => {
            prompt += `--- ${mat.title} ---\n${mat.content}\n\n`;
        });
    }

    // Theme
    if (theme) {
        prompt += `\n🏷️ **TEMA DO CONTEÚDO:**\n`;
        if (themeHierarchy) {
            prompt += `- Hierarquia: ${themeHierarchy}\n`;
        }
        prompt += `- Tema Específico: ${theme.title}\n`;
        if (theme.description) prompt += `- Descrição: ${theme.description}\n`;
    }

    // User Notes
    if (userNotes && userNotes.trim()) {
        prompt += `\n📝 **INSTRUÇÕES ADICIONAIS:**\n`;
        prompt += `${userNotes}\n`;
    }

    prompt += `\n---\n\nCrie um script magnético completo seguindo a estrutura e estilo definidos. Seja criativo e impactante.`;

    return prompt;
}