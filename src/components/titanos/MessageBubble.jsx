/**
 * Componente de bolha de mensagem
 * Renderiza mensagens do usuário, sistema ou assistente com Markdown
 */

import React, { memo, useCallback, useMemo } from 'react';
import { Copy, Check, Bot, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCanvas } from '@/components/canvas/CanvasProvider';
import ReactMarkdown from 'react-markdown';

// Configuração de componentes Markdown (memoizado fora do componente)
const markdownComponents = {
  h1: ({children}) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
  h2: ({children}) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
  h3: ({children}) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
  p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
  ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
  li: ({children}) => <li className="text-sm">{children}</li>,
  strong: ({children}) => <strong className="font-semibold">{children}</strong>,
  em: ({children}) => <em className="italic">{children}</em>,
  code: ({inline, children}) => inline 
    ? <code className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
    : <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs my-2"><code>{children}</code></pre>,
  blockquote: ({children}) => <blockquote className="border-l-2 border-indigo-300 pl-3 italic text-slate-600 my-2">{children}</blockquote>,
  hr: () => <div className="my-4 flex items-center gap-2"><div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" /></div>,
};

function MessageBubble({ role, content, metrics, modelName, chatTitle, isInitialPrompt }) {
  const [copied, setCopied] = React.useState(false);
  const [sentToCanvas, setSentToCanvas] = React.useState(false);
  const { sendToCanvas } = useCanvas();
  
  const isUser = role === 'user';
  const isSystem = role === 'system';
  
  // Display simplified text for initial prompt
  const displayContent = useMemo(() => 
    isInitialPrompt ? "Com base nos dados enviados, gere o conteúdo" : content,
    [isInitialPrompt, content]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleSendToCanvas = useCallback(() => {
    sendToCanvas(content, chatTitle || modelName || 'Multi Chat', 'chat');
    setSentToCanvas(true);
    setTimeout(() => setSentToCanvas(false), 2000);
  }, [content, chatTitle, modelName, sendToCanvas]);

  // System message
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-slate-100 text-slate-500 text-xs px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-2">
          <Bot className="w-3 h-3" />
          <span className="font-medium">System Prompt:</span>
          <span className="truncate max-w-[200px]">{content}</span>
        </div>
      </div>
    );
  }



    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group mb-6 px-1`}>
            {/* Avatar */}
            <div className={`shrink-0 ${isUser ? 'mt-0' : 'mt-0'}`}>
                {isUser ? (
                    <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
                        <AvatarFallback className="bg-slate-900 text-white text-xs font-medium">EU</AvatarFallback>
                    </Avatar>
                ) : (
                    <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <Bot className="w-4 h-4 text-indigo-600" />
                    </div>
                )}
            </div>

            {/* Content Bubble */}
            <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`
                    relative px-5 py-4 text-sm leading-relaxed shadow-sm transition-all
                    ${isUser 
                        ? 'bg-slate-700 text-white rounded-2xl rounded-tr-sm shadow-md' 
                        : 'bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm shadow-sm hover:shadow-md hover:border-indigo-100/50'}
                `}>
                    <div className={`${isUser ? 'text-slate-100' : 'text-slate-700'} prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
                        {isUser ? (
                            <span className="whitespace-pre-wrap">{displayContent}</span>
                        ) : (
                            <ReactMarkdown
                                components={{
                                    h1: ({children}) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
                                    h2: ({children}) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                                    h3: ({children}) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                    ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                    li: ({children}) => <li className="text-sm">{children}</li>,
                                    strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                    em: ({children}) => <em className="italic">{children}</em>,
                                    code: ({inline, children}) => inline 
                                        ? <code className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                                        : <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs my-2"><code>{children}</code></pre>,
                                    blockquote: ({children}) => <blockquote className="border-l-2 border-indigo-300 pl-3 italic text-slate-600 my-2">{children}</blockquote>,
                                    hr: () => <div className="my-4 flex items-center gap-2"><div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" /></div>,
                                }}
                            >
                                {displayContent}
                            </ReactMarkdown>
                        )}
                    </div>

                    {!isUser && (
                        <div className="absolute -bottom-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white rounded-full px-1.5 py-1 shadow-sm border border-slate-100 z-10 translate-y-1/2">
                            <button 
                                onClick={handleSendToCanvas}
                                className={`p-1 rounded-full transition-colors ${sentToCanvas ? 'bg-green-100 text-green-600' : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'}`}
                                title={sentToCanvas ? "Enviado!" : "Enviar ao Canvas"}
                            >
                                {sentToCanvas ? <Check className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            </button>
                            <button 
                                onClick={handleCopy}
                                className={`p-1 rounded-full transition-colors ${copied ? 'bg-green-100 text-green-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                                title={copied ? "Copiado!" : "Copiar resposta"}
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Metrics Footer */}
                {!isUser && metrics && (
                    <div className="flex items-center gap-2 mt-1.5 ml-1 text-[10px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {metrics.duration && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                                {(metrics.duration / 1000).toFixed(2)}s
                            </span>
                        )}
                        {metrics.usage?.total_tokens && (
                            <span className="flex items-center gap-1">
                                <span>•</span> {metrics.usage.total_tokens} tokens
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}