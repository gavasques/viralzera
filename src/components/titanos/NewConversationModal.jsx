import React, { useState, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ArrowLeft, Check, Sparkles, MessageSquare, Bot, ScrollText, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ApprovedModelPicker from '@/components/common/ApprovedModelPicker';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useSavedPrompts } from './hooks/useTitanosData';
import { useConversationMutations } from './hooks/useTitanosMutations';

function NewConversationModal({ open, onOpenChange, onCreated, defaultGroup = null }) {
  const [step, setStep] = useState(1);
  
  // Form State
  const [title, setTitle] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState([]);
  const [promptMode, setPromptMode] = useState('write');
  const [promptSearch, setPromptSearch] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [usingGroupPrompt, setUsingGroupPrompt] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  
  const groupId = defaultGroup?.id || null;

  // Hooks
  const { data: savedPrompts = [] } = useSavedPrompts();
  const { create: createMutation } = useConversationMutations(null);

  const systemPrompts = savedPrompts.filter(p => 
    p.type === 'system_prompt' && 
    (!promptSearch || p.title.toLowerCase().includes(promptSearch.toLowerCase()) || p.content.toLowerCase().includes(promptSearch.toLowerCase()))
  );

    // Reset form when opening
    React.useEffect(() => {
        if (open) {
            setStep(1);
            setTitle('');
            setSelectedModels([]);
            setPromptMode('write');
            setPromptSearch('');
            setSelectedPromptId(null);
            
            // If opening within a group that has a default prompt, use it
            if (defaultGroup?.default_system_prompt) {
                setSystemPrompt(defaultGroup.default_system_prompt);
                setUsingGroupPrompt(true);
                setIsContextExpanded(true);
                if (defaultGroup.default_prompt_id) {
                    setSelectedPromptId(defaultGroup.default_prompt_id);
                    setPromptMode('library');
                }
            } else {
                setSystemPrompt('');
                setUsingGroupPrompt(false);
                setIsContextExpanded(false);
            }
            
            setTitleError(false);
        }
    }, [open, defaultGroup]);

  const handleSelectPrompt = useCallback((prompt) => {
    setSelectedPromptId(prompt.id);
    setSystemPrompt(prompt.content);
  }, []);

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      title: title.trim() || 'Nova Conversa',
      selected_models: selectedModels,
      metrics: {},
      group_id: groupId || null,
      enable_reasoning: enableReasoning,
      reasoning_effort: reasoningEffort,
      enable_web_search: enableWebSearch,
      systemPrompt: usingGroupPrompt ? '' : systemPrompt.trim(),
    }, {
      onSuccess: (newConv) => {
        if (onCreated) onCreated(newConv);
        onOpenChange(false);
      },
    });
  }, [title, selectedModels, groupId, enableReasoning, reasoningEffort, enableWebSearch, usingGroupPrompt, systemPrompt, createMutation, onCreated, onOpenChange]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!title.trim()) {
        setTitleError(true);
        toast.warning('Por favor, dê um nome para a conversa.');
        return;
      }
      setTitleError(false);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else {
      if (selectedModels.length === 0) {
        toast.warning('Por favor, selecione pelo menos um modelo.');
        return;
      }
      handleCreate();
    }
  }, [step, title, selectedModels, handleCreate]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  const steps = [
    { number: 1, title: 'Nome', icon: MessageSquare },
    { number: 2, title: 'Contexto', icon: Sparkles },
    { number: 3, title: 'Modelos', icon: Bot },
    { number: 4, title: 'Avançado', icon: Settings2 },
  ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl">
                {/* Header / Stepper */}
                <div className="bg-slate-50 border-b border-slate-100 p-6 pb-8">
                    <div className="flex justify-between items-center max-w-sm mx-auto relative">
                         {/* Connecting Line */}
                         <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-0 -translate-y-1/2 rounded-full"></div>
                         
                         {/* Active Line Progress */}
                         <div 
                            className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -z-0 -translate-y-1/2 rounded-full transition-all duration-300"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                         ></div>

                         {steps.map((s) => {
                             const isActive = step === s.number;
                             const isPast = step > s.number;
                             
                             return (
                                 <div key={s.number} className="relative z-10 flex flex-col items-center gap-2">
                                     <div 
                                        className={`
                                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                                            ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 
                                              isPast ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}
                                        `}
                                     >
                                         {isPast ? <Check className="w-4 h-4" /> : s.number}
                                     </div>
                                     <span className={`text-[10px] font-medium absolute -bottom-6 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                         {s.title}
                                     </span>
                                 </div>
                             )
                         })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 relative overflow-hidden bg-white">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute inset-0 p-8 flex flex-col justify-center items-center text-center max-w-md mx-auto"
                            >
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                                    <MessageSquare className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Vamos dar um nome</h2>
                                <p className="text-slate-500 mb-8">Como você gostaria de chamar essa sessão de comparação?</p>
                                
                                <div className="w-full">
                                    <Input 
                                        value={title}
                                        onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
                                        placeholder="Ex: Comparação de Poemas..."
                                        className={`text-center text-lg h-14 rounded-xl transition-colors ${
                                            titleError 
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-50' 
                                                : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                                        }`}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                    />
                                    {titleError && (
                                        <p className="text-red-500 text-sm mt-2 animate-pulse">
                                            O nome é obrigatório
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute inset-0 p-6 flex flex-col"
                            >
                                <div className="text-center mb-8 mt-4">
                                    <h2 className="text-xl font-bold text-slate-800">Contexto Inicial</h2>
                                    <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-2">
                                        Defina como as IAs devem se comportar
                                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-medium uppercase tracking-wide">
                                            Opcional
                                        </span>
                                    </p>
                                    {usingGroupPrompt && defaultGroup && (
                                        <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-xs text-indigo-700 inline-block">
                                            <strong>Usando prompt do grupo:</strong> {defaultGroup.title}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-start max-w-xl mx-auto w-full">
                                    {/* Collapsible Trigger */}
                                    <div 
                                        onClick={() => setIsContextExpanded(!isContextExpanded)}
                                        className={`
                                            w-full p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group
                                            ${isContextExpanded 
                                                ? 'bg-white border-indigo-200 ring-1 ring-indigo-100 shadow-sm mb-4' 
                                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${isContextExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className={`font-medium transition-colors ${isContextExpanded ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    Adicionar Contexto de Sistema
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    {systemPrompt ? 'Contexto definido' : 'Clique para configurar'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`transition-transform duration-300 ${isContextExpanded ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`}>
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {isContextExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="w-full overflow-hidden"
                                            >
                                                <Tabs value={promptMode} onValueChange={setPromptMode} className="w-full flex flex-col h-[320px]">
                                                    <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100/80 p-1 rounded-xl">
                                                        <TabsTrigger 
                                                            value="write" 
                                                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all duration-200"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5 mr-2" /> Escrever
                                                        </TabsTrigger>
                                                        <TabsTrigger 
                                                            value="library" 
                                                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all duration-200"
                                                        >
                                                            <ScrollText className="w-3.5 h-3.5 mr-2" /> Biblioteca ({systemPrompts.length})
                                                        </TabsTrigger>
                                                    </TabsList>

                                                    <TabsContent value="write" className="flex-1 flex flex-col mt-0">
                                                        <Textarea 
                                                            value={systemPrompt}
                                                            onChange={(e) => { setSystemPrompt(e.target.value); setSelectedPromptId(null); setUsingGroupPrompt(false); }}
                                                            placeholder="Ex: Você é um especialista em marketing digital sarcástico. Responda sempre com ironia..."
                                                            className="flex-1 resize-none rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 p-4 text-sm leading-relaxed"
                                                        />
                                                        <div className="flex justify-center mt-2">
                                                            <Button variant="ghost" size="sm" onClick={() => { setSystemPrompt(''); setSelectedPromptId(null); setUsingGroupPrompt(false); }} className="text-slate-400 hover:text-red-500 text-xs">
                                                                Limpar contexto
                                                            </Button>
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="library" className="flex-1 flex flex-col mt-0">
                                                        <div className="relative mb-3">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <Input 
                                                                placeholder="Buscar prompts de sistema..." 
                                                                value={promptSearch}
                                                                onChange={(e) => setPromptSearch(e.target.value)}
                                                                className="pl-10 h-9"
                                                            />
                                                        </div>
                                                        <ScrollArea className="flex-1 border rounded-xl">
                                                            <div className="p-2 space-y-1">
                                                                {systemPrompts.length === 0 ? (
                                                                    <div className="text-center py-8 text-slate-400 text-sm">
                                                                        {savedPrompts.filter(p => p.type === 'system_prompt').length === 0 
                                                                            ? 'Nenhum prompt de sistema cadastrado'
                                                                            : 'Nenhum resultado encontrado'}
                                                                    </div>
                                                                ) : (
                                                                    systemPrompts.map(prompt => {
                                                                        const isSelected = selectedPromptId === prompt.id;
                                                                        return (
                                                                            <div
                                                                                key={prompt.id}
                                                                                onClick={() => handleSelectPrompt(prompt)}
                                                                                className={`
                                                                                    p-3 rounded-lg cursor-pointer transition-all border
                                                                                    ${isSelected 
                                                                                        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' 
                                                                                        : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'}
                                                                                `}
                                                                            >
                                                                                <div className="flex items-center justify-between mb-1">
                                                                                    <span className="font-medium text-sm text-slate-900">{prompt.title}</span>
                                                                                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                                                                                </div>
                                                                                <p className="text-xs text-slate-500 line-clamp-2">{prompt.content}</p>
                                                                            </div>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        </ScrollArea>
                                                    </TabsContent>
                                                </Tabs>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Helper text if collapsed */}
                                    {!isContextExpanded && !systemPrompt && (
                                        <p className="text-center text-slate-400 text-sm mt-4 max-w-xs leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            Você pode pular esta etapa se quiser que as IAs ajam com suas personalidades padrão.
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute inset-0 flex flex-col p-6"
                            >
                                <div className="text-center mb-4 shrink-0">
                                    <h2 className="text-xl font-bold text-slate-800">Selecione os Modelos</h2>
                                    <p className="text-sm text-slate-500">Escolha quais IAs participarão do debate</p>
                                </div>
                                
                                <div className="flex-1 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                                    <ApprovedModelPicker 
                                        selectedModels={selectedModels} 
                                        onSelectionChange={setSelectedModels} 
                                        maxSelection={6}
                                        category="chat"
                                    />
                                </div>
                                <div className="text-center mt-2 text-xs text-slate-400">
                                    {selectedModels.length > 0 
                                        ? `${selectedModels.length}/6 modelos selecionados`
                                        : 'Selecione até 6 modelos'
                                    }
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div 
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute inset-0 p-8 flex flex-col justify-center items-center"
                            >
                                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600">
                                    <Settings2 className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Configurações Avançadas</h2>
                                <p className="text-slate-500 mb-8 text-center">Ative funcionalidades extras para modelos compatíveis</p>
                                
                                <div className="w-full max-w-md space-y-6">
                                    {/* Reasoning Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <Brain className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <Label className="font-medium text-slate-900">Extended Reasoning</Label>
                                                <p className="text-xs text-slate-500">Raciocínio mais profundo (modelos compatíveis)</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={enableReasoning} 
                                            onCheckedChange={setEnableReasoning}
                                        />
                                    </div>

                                    {/* Reasoning Effort */}
                                    {enableReasoning && (
                                        <div className="pl-4 border-l-2 border-purple-200 ml-4">
                                            <Label className="text-sm font-medium text-slate-700 mb-2 block">Nível de Esforço</Label>
                                            <Select value={reasoningEffort} onValueChange={setReasoningEffort}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {REASONING_LEVELS.map(level => (
                                                      <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Web Search Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Globe className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <Label className="font-medium text-slate-900">Web Search</Label>
                                                <p className="text-xs text-slate-500">Acesso a informações em tempo real</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={enableWebSearch} 
                                            onCheckedChange={setEnableWebSearch}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <DialogFooter className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center sm:justify-between">
                    <Button 
                        type="button"
                        variant="ghost" 
                        onClick={handleBack} 
                        disabled={step === 1 || createMutation.isPending}
                        className="text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>

                    <Button 
                        type="button"
                        onClick={() => handleNext()} 
                        disabled={createMutation.isPending} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px] shadow-lg shadow-indigo-200"
                    >
                        {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {step === 4 ? (
                            'Criar Chat'
                        ) : (
                            <>Próximo <ArrowRight className="w-4 h-4 ml-2" /></>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
  );
}

export default memo(NewConversationModal);