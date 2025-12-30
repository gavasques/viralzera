import React, { useState, useEffect } from 'react';
import { Loader2, Bot, Brain, Globe, Sparkles } from "lucide-react";

/**
 * Indicador de carregamento animado para o chat
 * 
 * Props:
 * - isReasoning: Se está usando Extended Reasoning
 * - isSearching: Se está fazendo Web Search
 * - model: Nome do modelo sendo usado
 */
export default function ChatLoadingIndicator({ 
  isReasoning = false, 
  isSearching = false,
  model = ''
}) {
  const [dots, setDots] = useState('');
  const [step, setStep] = useState(0);

  // Animação dos pontos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Ciclo de mensagens quando usa reasoning
  useEffect(() => {
    if (!isReasoning) return;
    
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, [isReasoning]);

  const reasoningSteps = [
    "Analisando contexto",
    "Processando raciocínio",
    "Elaborando resposta",
    "Finalizando análise"
  ];

  const getMessage = () => {
    if (isSearching) return "Buscando na web";
    if (isReasoning) return reasoningSteps[step];
    return "Gerando resposta";
  };

  const getIcon = () => {
    if (isSearching) return <Globe className="w-4 h-4 text-blue-500 animate-pulse" />;
    if (isReasoning) return <Brain className="w-4 h-4 text-purple-500 animate-pulse" />;
    return <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />;
  };

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {getIcon()}
              <span className="text-sm text-slate-600">
                {getMessage()}{dots}
              </span>
            </div>
            
            {model && (
              <span className="text-xs text-slate-400 mt-0.5">
                {model}
              </span>
            )}
          </div>
        </div>
        
        {/* Barra de progresso para reasoning */}
        {isReasoning && (
          <div className="mt-3 w-48">
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                style={{ width: `${((step + 1) / 4) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              {[0, 1, 2, 3].map(i => (
                <div 
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i <= step ? 'bg-purple-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}