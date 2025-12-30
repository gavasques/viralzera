import React from 'react';
import { Copy, Check, User, Bot, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCanvas } from '@/components/canvas/CanvasProvider';

export default function MessageBubble({ role, content, metrics, modelName, chatTitle, isInitialPrompt }) {
    const [copied, setCopied] = React.useState(false);
    const [sentToCanvas, setSentToCanvas] = React.useState(false);
    const { sendToCanvas } = useCanvas();
    const isUser = role === 'user';
    const isSystem = role === 'system';
    
    // Display simplified text for initial prompt
    const displayContent = isInitialPrompt 
        ? "Com base nos dados enviados, gere o conteúdo" 
        : content;

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendToCanvas = () => {
        sendToCanvas(content, chatTitle || modelName || 'Multi Chat', 'chat');
        setSentToCanvas(true);
        setTimeout(() => setSentToCanvas(false), 2000);
    };

    if (isSystem) {
        return (
            <div className="flex justify-center my-4">
                <div className="bg-slate-100 text-slate-500 text-xs px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-2">
                    <Bot className="w-3 h-3" />
                    <span className="font-medium">System Prompt:</span>
                    <span className="truncate max-w-[200px]">{content}</span>
                </div>
            </div>
        )
    }

    const components = {
        hr: ({node, ...props}) => (
            <div className={`my-6 flex items-center gap-4 ${isUser ? 'opacity-50' : ''}`}>
                <div className={`h-px flex-1 ${isUser ? 'bg-slate-600' : 'bg-slate-200/60'}`}></div>
                <div className={`w-1 h-1 rounded-full ${isUser ? 'bg-slate-500' : 'bg-slate-300'}`}></div>
                <div className={`h-px flex-1 ${isUser ? 'bg-slate-600' : 'bg-slate-200/60'}`}></div>
            </div>
        ),
        h1: ({node, ...props}) => <h1 className={`text-lg font-bold mt-6 mb-3 tracking-tight ${isUser ? 'text-white' : 'text-slate-900'}`} {...props} />,
        h2: ({node, ...props}) => <h2 className={`text-base font-bold mt-5 mb-2.5 tracking-tight ${isUser ? 'text-slate-100' : 'text-slate-800'}`} {...props} />,
        h3: ({node, ...props}) => <h3 className={`text-sm font-bold mt-4 mb-2 ${isUser ? 'text-slate-200' : 'text-slate-800'}`} {...props} />,
        ul: ({node, ...props}) => <ul className={`my-3 space-y-1.5 list-disc list-outside ml-4 ${isUser ? 'marker:text-slate-400' : 'marker:text-slate-400'}`} {...props} />,
        ol: ({node, ...props}) => <ol className={`my-3 space-y-1.5 list-decimal list-outside ml-4 ${isUser ? 'marker:text-slate-400' : 'marker:text-slate-500'} marker:font-medium`} {...props} />,
        li: ({node, ...props}) => <li className="pl-1 leading-relaxed" {...props} />,
        p: ({node, ...props}) => <p className="my-2 leading-relaxed" {...props} />,
        blockquote: ({node, ...props}) => (
            <blockquote className={`border-l-2 pl-4 py-1 my-4 rounded-r italic text-sm ${isUser ? 'border-slate-400 bg-slate-800/30 text-slate-200' : 'border-indigo-300 bg-indigo-50/50 text-slate-600'}`} {...props} />
        ),
        table: ({node, ...props}) => (
            <div className={`my-4 overflow-x-auto rounded-lg border shadow-sm ${isUser ? 'border-slate-600 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                <table className="w-full text-xs text-left" {...props} />
            </div>
        ),
        thead: ({node, ...props}) => <thead className={`${isUser ? 'bg-slate-800/50 border-slate-600 text-slate-200' : 'bg-slate-50/80 border-slate-100 text-slate-600'} border-b font-semibold`} {...props} />,
        tbody: ({node, ...props}) => <tbody className={`divide-y ${isUser ? 'divide-slate-600' : 'divide-slate-100'}`} {...props} />,
        tr: ({node, ...props}) => <tr className={`transition-colors ${isUser ? 'hover:bg-slate-600/50' : 'hover:bg-slate-50/50'}`} {...props} />,
        th: ({node, ...props}) => <th className="px-3 py-2.5 whitespace-nowrap" {...props} />,
        td: ({node, ...props}) => <td className={`px-3 py-2.5 align-top ${isUser ? 'text-slate-300' : 'text-slate-600'}`} {...props} />,
        code: ({node, inline, className, children, ...props}) => {
            if (inline) {
                return <code className={`px-1.5 py-0.5 rounded font-mono text-[12px] ${isUser ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200/60'}`} {...props}>{children}</code>
            }
            
            // Ensure we don't render empty code blocks
            const contentStr = Array.isArray(children) ? children.join('') : String(children);
            if (!contentStr || !contentStr.trim()) return null;

            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : (className?.replace('language-', '') || 'CODE');

            return (
                <div className={`my-4 rounded-lg overflow-hidden border ${isUser ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                    <div className={`flex items-center justify-between px-3 py-1.5 border-b ${isUser ? 'border-slate-600 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${isUser ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                            <div className={`w-2.5 h-2.5 rounded-full ${isUser ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                            <div className={`w-2.5 h-2.5 rounded-full ${isUser ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                        </div>
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
                            {language}
                        </span>
                    </div>
                    <pre className={`p-3.5 overflow-x-auto whitespace-pre-wrap break-words text-xs font-mono leading-relaxed ${isUser ? 'text-slate-200' : 'text-slate-600'}`} {...props}>
                        <code>{children}</code>
                    </pre>
                </div>
            )
        }
    };

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
                    <div className={isUser ? 'text-slate-100 marker:text-slate-400' : 'text-slate-700'}>
                        <Suspense fallback={<div className="whitespace-pre-wrap">{displayContent}</div>}>
                            <ReactMarkdown components={components}>{displayContent}</ReactMarkdown>
                        </Suspense>
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