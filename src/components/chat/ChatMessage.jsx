import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, Check, User, Bot, FileText, ExternalLink, 
  ChevronDown, ChevronUp, Coins, Globe, Brain 
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SaveFromChatButton from './SaveFromChatButton';
import PersonaPreviewCard from '@/components/persona/PersonaPreviewCard';
import { hasPersonaData } from '@/components/persona/personaExtractor';

/**
 * Componente unificado para renderizar mensagens de chat
 * 
 * Props:
 * - message: { role, content, usage, citations, timestamp }
 * - onCopy: Callback ao copiar
 * - onSendToCanvas: Callback para enviar ao canvas
 * - onAction: Callback para ações customizadas (ex: salvar persona)
 * - actionButton: { label, icon, onClick, show } - Botão de ação customizado
 * - showUsage: Mostrar uso de tokens
 * - focusId: ID do foco atual (para salvar dados extraídos)
 * - onDataSaved: Callback quando dados são salvos do chat
 */
export default function ChatMessage({ 
  message, 
  onCopy,
  onSendToCanvas,
  actionButton,
  showUsage = true,
  focusId,
  onDataSaved,
  className = ''
}) {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = message.role === 'user';
  
  // Truncate long messages (approx 500 chars)
  const shouldTruncate = message.content.length > 500;
  const displayContent = !isExpanded && shouldTruncate 
    ? message.content.slice(0, 500) + "..." 
    : message.content;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(message.content);
  };

  // Renderiza mensagem do usuário
  if (isUser) {
    return (
      <div className={`flex justify-end ${className}`}>
        <div className="flex gap-3 flex-row-reverse max-w-[85%]">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="rounded-2xl rounded-tr-sm px-4 py-3 bg-indigo-600 text-white shadow-sm overflow-hidden">
            <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{displayContent}</p>
            
            {shouldTruncate && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-indigo-200 hover:text-white mt-2 underline underline-offset-2 font-medium"
              >
                {isExpanded ? "Ler menos" : "Ler mais"}
              </button>
            )}
            
            {/* Arquivos anexados */}
            {message.files?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-indigo-500 flex flex-wrap gap-1">
                {message.files.map((file, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-indigo-500 text-white text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    {file.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Renderiza mensagem do assistente
  return (
    <div className={`flex flex-col items-start group w-full ${className}`}>
      <div className="flex gap-3 max-w-[90%] w-full">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl rounded-tl-sm px-5 py-4 bg-white border border-slate-200 shadow-sm">
            {/* Conteúdo Markdown */}
            <div className="prose prose-sm max-w-none 
              prose-headings:font-bold prose-headings:text-slate-900 prose-headings:tracking-tight
              prose-h1:text-xl prose-h1:mt-6 prose-h1:mb-3 
              prose-h2:text-lg prose-h2:mt-5 prose-h2:mb-2.5
              prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
              
              prose-p:my-2 prose-p:leading-relaxed prose-p:text-slate-700 
              
              prose-strong:font-bold prose-strong:text-slate-900
              
              prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5
              prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-5
              prose-li:my-0.5 prose-li:text-slate-700
              
              prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-slate-800 prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-3
              
              prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:rounded-r prose-blockquote:my-3
              
              prose-hr:my-6 prose-hr:border-slate-200"
            >
              <ReactMarkdown
                components={{
                  a: ({node, ...props}) => (
                    <a {...props} className="text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-4" target="_blank" rel="noopener noreferrer" />
                  ),
                  hr: ({node, ...props}) => (
                    <div className="flex items-center gap-2 my-8 opacity-50">
                      <div className="h-px bg-slate-200 flex-1" />
                      <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                      </div>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>
                  ),
                  table: ({node, ...props}) => (
                    <div className="my-6 w-full overflow-hidden rounded-lg border border-slate-200">
                      <table {...props} className="w-full text-sm text-left" />
                    </div>
                  ),
                  thead: ({node, ...props}) => (
                    <thead {...props} className="bg-slate-50/80 border-b border-slate-100" />
                  ),
                  tbody: ({node, ...props}) => (
                    <tbody {...props} className="divide-y divide-slate-50" />
                  ),
                  tr: ({node, ...props}) => (
                    <tr {...props} className="hover:bg-slate-50/50 transition-colors" />
                  ),
                  th: ({node, ...props}) => (
                    <th {...props} className="px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider whitespace-nowrap" />
                  ),
                  td: ({node, ...props}) => (
                    <td {...props} className="px-4 py-3 text-slate-600 align-top leading-relaxed" />
                  ),
                  code({node, inline, className, children, ...props}) {
                    return !inline ? (
                      <div className="relative my-4 rounded-lg bg-slate-900 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-slate-400 hover:text-slate-100"
                            onClick={() => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                              toast.success('Código copiado!');
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <pre className="p-4 overflow-x-auto text-xs text-slate-50 font-mono">
                          <code {...props} className="bg-transparent p-0 text-inherit">
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code {...props} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 text-xs font-mono border border-slate-200">
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Citações Web */}
            {message.citations?.length > 0 && (
              <Collapsible open={showCitations} onOpenChange={setShowCitations} className="mt-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-slate-500 hover:text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      {message.citations.length} fonte(s) da web
                    </span>
                    {showCitations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2">
                    {message.citations.map((citation, idx) => (
                      <a 
                        key={idx}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-700 truncate">{citation.title || citation.url}</p>
                          {citation.content && (
                            <p className="text-slate-500 line-clamp-2 mt-0.5">{citation.content}</p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Persona Preview Card */}
          {focusId && hasPersonaData(message.content) && (
            <div className="mt-4">
              <PersonaPreviewCard 
                content={message.content}
                focusId={focusId}
                onSaved={onDataSaved}
              />
            </div>
          )}

          {/* Footer com ações e uso de tokens */}
          <div className="flex items-center justify-between mt-1.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              {/* Botão de salvar dados extraídos */}
              {focusId && (
                <SaveFromChatButton 
                  content={message.content}
                  focusId={focusId}
                  onSaved={onDataSaved}
                />
              )}
              
              {/* Botão de ação customizado */}
              {actionButton?.show && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs"
                  onClick={actionButton.onClick}
                  disabled={actionButton.disabled}
                >
                  {actionButton.icon}
                  {actionButton.label}
                </Button>
              )}
              
              {/* Enviar ao Canvas */}
              {onSendToCanvas && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-indigo-600 hover:bg-indigo-50 text-xs"
                  onClick={() => onSendToCanvas(message.content)}
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Canvas
                </Button>
              )}
              
              {/* Copiar */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-slate-100"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </Button>
            </div>

            {/* Uso de tokens */}
            {showUsage && message.usage && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Coins className="w-3 h-3" />
                <span>{message.usage.totalTokens?.toLocaleString()} tokens</span>
                {message.usage.reasoningTokens > 0 && (
                  <span className="flex items-center gap-1 text-purple-500">
                    <Brain className="w-3 h-3" />
                    {message.usage.reasoningTokens?.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}