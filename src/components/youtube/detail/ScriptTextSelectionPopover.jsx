import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, ArrowRight, Loader2, Check, X, ArrowDown } from "lucide-react";
import { neon } from "@/api/neonClient";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { sendMessage } from "@/components/services/OpenRouterDirectService";

const QUICK_ACTIONS = [
  { id: 'improve', label: 'Melhorar', prompt: 'Melhore este trecho mantendo o mesmo sentido, mas com mais clareza e fluidez' },
  { id: 'expand', label: 'Expandir', prompt: 'Expanda este trecho com mais detalhes' },
  { id: 'shorten', label: 'Resumir', prompt: 'Resuma este trecho mantendo o essencial' },
  { id: 'rewrite', label: 'Reescrever', prompt: 'Reescreva este trecho de forma diferente' },
];

export default function ScriptTextSelectionPopover({ 
  selectedText, 
  position, 
  onClose,
  onReplaceText,
  onInsertBelow,
  fullContent,
  scriptTitle
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [generatedText, setGeneratedText] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch Agent Config
  const { data: config } = useQuery({
    queryKey: ['YoutubeScriptEditorConfig', 'global'],
    queryFn: async () => {
      const configs = await neon.entities.YoutubeScriptEditorConfig.list('-created_date', 1);
      return configs[0] || null;
    },
    staleTime: 1000 * 60 * 5
  });

  // Focus input when showing custom input
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAction = async (actionPrompt) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!config?.model) {
        throw new Error('Agente de Edição não configurado. Vá em Admin -> Agentes e configure "Roteiros - Edição Notion".');
      }

      // Build system prompt with placeholders replaced
      let systemPrompt = config.prompt || '';
      
      // Replace placeholders with actual values (context will be fetched if available)
      systemPrompt = systemPrompt
        .replace(/\{\{persona\}\}/g, '(Persona não disponível neste contexto)')
        .replace(/\{\{tese_principal\}\}/g, '(Tese não disponível neste contexto)')
        .replace(/\{\{publico_alvo\}\}/g, '(Público-alvo não disponível neste contexto)')
        .replace(/\{\{roteiro_completo\}\}/g, fullContent || '(Roteiro vazio)');

      const userMessage = `AÇÃO SOLICITADA: ${actionPrompt}

TRECHO SELECIONADO PARA EDIÇÃO:
"""
${selectedText}
"""

Retorne APENAS o texto editado, pronto para substituir o trecho acima.`;

      const messages = [
        { 
          role: 'system', 
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await sendMessage({
        model: config.model,
        messages,
        options: {
          enableReasoning: config.enable_reasoning,
          reasoningEffort: config.reasoning_effort,
          enableWebSearch: config.enable_web_search,
          maxTokens: config.max_tokens || 32000,
          feature: 'YoutubeScriptEditor'
        }
      });

      const newText = response.content;
      
      if (newText) {
        setGeneratedText(newText.trim());
        setIsReviewing(true);
      } else {
        throw new Error('Resposta vazia da IA');
      }
    } catch (error) {
      console.error('Selection AI error:', error);
      toast.error('Erro: ' + (error.message || 'Tente novamente'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      handleAction(customPrompt.trim());
    }
  };

  const handleConfirmReplace = () => {
    if (generatedText) {
      onReplaceText(generatedText);
      toast.success('Texto substituído!');
      onClose();
    }
  };

  const handleConfirmInsertBelow = () => {
    if (generatedText) {
      onInsertBelow(generatedText);
      toast.success('Texto adicionado abaixo!');
      onClose();
    }
  };

  const handleDiscard = () => {
    setGeneratedText(null);
    setIsReviewing(false);
    setShowCustomInput(false);
  };

  // Calculate position to keep popover in viewport
  const getPopoverStyle = () => {
    const style = {
      position: 'fixed',
      zIndex: 9999,
    };

    if (position) {
      // Calculate width based on content state
      const popoverWidth = isReviewing || showCustomInput ? 400 : 450; 
      const screenPadding = 20;
      
      // Center horizontally relative to selection, but clamp to screen edges
      let leftPos = position.x - (popoverWidth / 2);
      
      // Clamp left edge
      leftPos = Math.max(screenPadding, leftPos);
      
      // Clamp right edge
      if (leftPos + popoverWidth > window.innerWidth - screenPadding) {
        leftPos = window.innerWidth - popoverWidth - screenPadding;
      }
      
      style.left = leftPos;
      
      // Position above by default if enough space, otherwise below
      const spaceAbove = position.y - 100;
      if (spaceAbove > 150) {
          style.top = Math.max(screenPadding, position.y - 10);
          style.transform = 'translateY(-100%)';
      } else {
          style.top = position.bottom + 10;
      }
    }

    return style;
  };

  if (!selectedText || !position) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={getPopoverStyle()}
      className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-[9999]"
    >
      {isLoading ? (
        <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-indigo-600 bg-indigo-50/50 min-w-[300px]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>A IA está trabalhando no seu texto...</span>
        </div>
      ) : isReviewing ? (
        <div className="flex flex-col w-[400px]">
          <div className="px-4 py-3 bg-indigo-50/30 border-b border-indigo-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide">
              <Sparkles className="w-3 h-3" />
              Sugestão da IA
            </div>
            <div className="text-sm text-slate-700 leading-relaxed max-h-[200px] overflow-y-auto pr-1 custom-scrollbar whitespace-pre-wrap">
              {generatedText}
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 px-3 text-xs"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Descartar
            </Button>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleConfirmInsertBelow}
                className="h-8 px-3 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <ArrowDown className="w-3.5 h-3.5 mr-1.5" />
                Abaixo
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReplace}
                className="bg-indigo-600 hover:bg-indigo-700 h-8 px-3 text-xs"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Substituir
              </Button>
            </div>
          </div>
        </div>
      ) : showCustomInput ? (
        <form onSubmit={handleCustomSubmit} className="p-2 w-[400px]">
          <div className="flex items-center gap-2">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowCustomInput(false)}
                className="h-9 w-9 shrink-0 text-slate-400 hover:text-slate-600"
            >
                <X className="w-4 h-4" />
            </Button>
            <input
              ref={inputRef}
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="O que fazer com o texto?"
              className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowCustomInput(false);
                  setCustomPrompt('');
                }
              }}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!customPrompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 h-9 px-3"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center p-1 bg-white">
          <div className="flex items-center gap-0.5 border-r border-slate-100 pr-1 mr-1">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.prompt)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors whitespace-nowrap"
              >
                {action.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors whitespace-nowrap"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Pedir algo específico...
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}