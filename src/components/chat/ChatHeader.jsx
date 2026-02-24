import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Brain, Globe, Coins } from "lucide-react";

/**
 * Header unificado para chat
 * 
 * Props:
 * - title: título da sessão
 * - subtitle: subtítulo opcional
 * - modelName: nome do modelo
 * - messageCount: número de mensagens
 * - totalTokens: total de tokens usados
 * - showReasoning: se reasoning está ativo
 * - showWebSearch: se web search está ativo
 * - children: conteúdo adicional (ex: persona info)
 */
export default function ChatHeader({
  title,
  subtitle,
  modelName,
  messageCount = 0,
  totalTokens,
  showReasoning = false,
  showWebSearch = false,
  children
}) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{title}</h3>
            {subtitle && (
              <p className="text-sm text-slate-500 truncate">{subtitle}</p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span>{messageCount} mensagens</span>
              {totalTokens && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    {totalTokens.toLocaleString()} tokens
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {showReasoning && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
                <Brain className="w-3 h-3" />
                Reasoning
              </Badge>
            )}
            {showWebSearch && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                <Globe className="w-3 h-3" />
                Web
              </Badge>
            )}
            {modelName && (
              <Badge variant="outline" className="text-xs">
                {modelName}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {children && (
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          {children}
        </div>
      )}
    </div>
  );
}