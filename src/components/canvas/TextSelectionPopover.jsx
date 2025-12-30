import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, ArrowRight, Loader2, Check, X, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAgentConfig } from "@/components/constants/agentConfigs";

const QUICK_ACTIONS = [
  { id: 'improve', label: 'Melhorar', prompt: 'Melhore este trecho mantendo o mesmo sentido, mas com mais clareza e fluidez:' },
  { id: 'expand', label: 'Expandir', prompt: 'Expanda este trecho com mais detalhes e exemplos:' },
  { id: 'summarize', label: 'Resumir', prompt: 'Resuma este trecho de forma objetiva:' },
  { id: 'rewrite', label: 'Reescrever', prompt: 'Reescreva este trecho de forma diferente, mantendo o significado:' },
];

export default function TextSelectionPopover({ 
  selectedText, 
  position, 
  onClose,
  onReplaceText,
  fullContent,
  canvasTitle
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [generatedText, setGeneratedText] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch Canvas AI config
  const { data: config } = useQuery({
    queryKey: ['CanvasConfig', 'global'],
    queryFn: async () => {
      const configs = await base44.entities.CanvasConfig.list('-created_date', 1);
      return configs[0] || null;
    },
    staleTime: 1000 * 60 * 5
  });

  const agentConfig = getAgentConfig('canvas');

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
      const systemPrompt = config?.prompt || agentConfig.defaultPrompt;

      const messages = [
        { 
          role: 'system', 
          content: `${systemPrompt}\n\nIMPORTANTE: Você receberá um TRECHO SELECIONADO de um Canvas maior. Responda APENAS com o texto editado, sem explicações ou comentários adicionais. O usuário quer substituir o trecho original pelo que você gerar.`
        },
        {
          role: 'user',
          content: `${actionPrompt}\n\nTRECHO SELECIONADO:\n"${selectedText}"\n\nCONTEXTO DO CANVAS COMPLETO (para referência):\nTítulo: ${canvasTitle}\n${fullContent}`
        }
      ];

      const response = await base44.functions.invoke('openrouter', {
        action: 'chat',
        model: config?.model || 'openai/gpt-4o-mini',
        model_name: config?.model_name || 'GPT-4o Mini',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        feature: 'canvas_ai_selection',
        enableWebSearch: config?.enable_web_search || false
      });

      const newText = response.data?.choices?.[0]?.message?.content;
      
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
      onReplaceText(selectedText, generatedText);
      toast.success('Texto substituído!');
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
      // Position above the selection by default
      // Ensure popover width (~400px) doesn't overflow screen width
      const popoverWidth = 400; 
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
      style.top = Math.max(screenPadding, position.y - 10); // Ensure it doesn't go off top
      style.transform = 'translateY(-100%)';
    }

    return style;
  };

  if (!selectedText || !position) return null;

  return (
    <div
      ref={popoverRef}
      style={getPopoverStyle()}
      className="bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-[9999]"
    >
      {isLoading ? (
        <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-indigo-600 bg-indigo-50/50">
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
            <div className="text-sm text-slate-700 leading-relaxed max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
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
        <form onSubmit={handleCustomSubmit} className="p-2">
          <div className="flex items-center gap-2">
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
        <div className="flex flex-col">
          <div className="flex items-center gap-1 p-1.5 border-b border-slate-100">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.prompt)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Pedir algo específico...
          </button>
        </div>
      )}
    </div>
  );
}