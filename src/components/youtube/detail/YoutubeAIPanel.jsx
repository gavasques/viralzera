import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Send, Trash2, Bot, User, MessageSquareText, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { sendMessage } from "@/components/services/OpenRouterDirectService";

import { Copy, RefreshCw, ArrowDown, FileText, AlertTriangle } from "lucide-react";

export default function YoutubeAIPanel({ scriptId, scriptContext, onReplaceContent, onInsertContent }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [pendingReplaceContent, setPendingReplaceContent] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch chat history
  const { data: chatHistory = [], isLoading } = useQuery({
    queryKey: ['youtubeScriptChat', scriptId],
    queryFn: () => neon.entities.YoutubeScriptChat.filter({ script_id: scriptId }, 'created_date', 100),
    enabled: !!scriptId
  });

  // Get Agent Config for Model
  const { data: agentConfig } = useQuery({
    queryKey: ['youtubeGeneratorConfig'],
    queryFn: async () => {
      const configs = await neon.entities.YoutubeGeneratorConfig.list();
      return configs[0];
    }
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (userMessage) => {
      // 1. Save user message
      await neon.entities.YoutubeScriptChat.create({
        script_id: scriptId,
        role: 'user',
        content: userMessage
      });

      // 2. Prepare context
      const systemPrompt = `Você é um assistente especialista em reescrita e otimização de roteiros para YouTube.
      Sua missão é AJUSTAR, REESCREVER ou GERAR o roteiro com base no feedback do usuário.

      CONTEXTO DO ROTEIRO ATUAL:
      Título: ${scriptContext?.title || 'Sem título'}
      Tipo: ${scriptContext?.videoType || 'Não definido'}

      CONTEÚDO ORIGINAL DO ROTEIRO:
      ${scriptContext?.content || '(Roteiro vazio)'}

      REGRAS CRÍTICAS:
      1. Se o usuário pedir para criar, gerar ou escrever um roteiro: GERE O ROTEIRO IMEDIATAMENTE. NÃO FAÇA ANÁLISES.
      2. NÃO dê feedback, não faça elogios ("Ótimo roteiro", "Gostei da estrutura") e não aja como consultor, a menos que explicitamente solicitado.
      3. Sua resposta deve ser O PRÓPRIO CONTEÚDO do roteiro, pronto para ser usado.

      INSTRUÇÕES DE FORMATAÇÃO:
      1. Formate sua resposta de forma CLARA e ESTRUTURADA (use Markdown).
      2. Use Títulos (##) para separar seções. ONDE HOUVER SEPARAÇÃO DE TEMA, USE ##.
      3. Use Negrito (**) para destaques importantes (ex: nomes de personagens, ações visuais).
      4. NÃO use linhas horizontais manuais ou caracteres repetidos (ex: "---", "___", "***") para separar seções. Use apenas a estrutura de headers.
      5. Se for reescrever o roteiro, apresente o novo texto pronto.

      Visual: Para descrições visuais ou de cena, use (Parênteses e Negrito) ou Blockquotes (>).`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ];

      // 3. Call AI
      const response = await sendMessage({
        model: agentConfig?.config?.model || 'openai/gpt-4o-mini',
        messages: messages,
        options: {
          enableReasoning: agentConfig?.config?.enable_reasoning,
          reasoningEffort: agentConfig?.config?.reasoning_effort,
          maxTokens: agentConfig?.config?.max_tokens || 32000,
          feature: 'YoutubeScriptChat'
        }
      });

      // 4. Save assistant message
      await neon.entities.YoutubeScriptChat.create({
        script_id: scriptId,
        role: 'assistant',
        content: response.content,
        usage: response.usage
      });

      return response.content;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtubeScriptChat', scriptId] });
      setMessage('');
    },
    onError: (error) => {
      toast.error('Erro ao enviar mensagem: ' + error.message);
    }
  });

  // Clear chat
  const clearMutation = useMutation({
    mutationFn: async () => {
      const msgs = await neon.entities.YoutubeScriptChat.filter({ script_id: scriptId });
      await Promise.all(msgs.map(m => neon.entities.YoutubeScriptChat.delete(m.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtubeScriptChat', scriptId] });
      toast.success('Chat limpo!');
    }
  });

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
         scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatHistory, isLoading]);

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="flex items-center justify-between p-4 pr-12 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-700">Recriar com IA</h3>
        </div>
        {chatHistory.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-red-500"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            title="Limpar histórico"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                <RefreshCw className="w-6 h-6 text-indigo-500" />
            </div>
            <p className="text-slate-700 font-medium text-sm mb-2">Recriar ou Ajustar Roteiro</p>
            <p className="text-slate-500 text-xs max-w-[280px] leading-relaxed">
              Diga o que você quer mudar no roteiro atual. Ex: "Reescreva com tom mais agressivo", "Adicione uma piada na introdução", "Simplifique a explicação técnica".
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-red-600" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-3 max-w-[90%] text-base break-words ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="flex flex-col gap-3">
                      <div className="prose max-w-none prose-p:my-2 prose-headings:my-4 break-words overflow-hidden text-slate-700">
                        <ReactMarkdown
                          components={{
                            pre: ({node, ...props}) => <div className="overflow-x-auto w-full my-5 bg-slate-900 rounded-xl p-5 text-slate-50 shadow-sm border border-slate-800"><pre {...props} /></div>,
                            code: ({node, inline, ...props}) => inline 
                              ? <code className="bg-indigo-50 px-1.5 py-0.5 rounded-md text-indigo-700 font-mono text-sm font-medium border border-indigo-100" {...props} />
                              : <code className="bg-transparent text-slate-50 font-mono text-sm whitespace-pre-wrap break-words" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-900 mt-8 mb-5 pb-3 border-b border-slate-100" {...props} />,
                            h2: ({node, ...props}) => (
                              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mt-10 mb-5 px-5 py-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border-l-4 border-indigo-500 shadow-sm" {...props}>
                                {props.children}
                              </h2>
                            ),
                            h3: ({node, ...props}) => (
                              <h3 className="text-base font-bold text-indigo-700 mt-6 mb-3 flex items-center gap-2" {...props}>
                                <span className="w-2 h-2 rounded-full bg-indigo-400/60" />
                                {props.children}
                              </h3>
                            ),
                            p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-700 text-[15px]" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 mb-5 text-slate-700 marker:text-slate-400" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-2 mb-5 text-slate-700 marker:text-slate-400" {...props} />,
                            blockquote: ({node, ...props}) => (
                              <blockquote className="border-l-4 border-amber-300 bg-amber-50/50 p-5 my-6 rounded-r-lg text-slate-700 italic text-base relative" {...props} />
                            ),
                            strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                            hr: ({node, ...props}) => <hr className="my-8 border-slate-100" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Action Buttons for Assistant Response */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5 bg-white"
                          onClick={() => handleCopy(msg.content, msg.id)}
                        >
                          {copiedId === msg.id ? (
                            <span className="text-green-600 font-medium">Copiado!</span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              Copiar
                            </>
                          )}
                        </Button>
                        
                        {onInsertContent && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                            onClick={() => {
                                onInsertContent(msg.content);
                                toast.success("Conteúdo inserido abaixo do roteiro atual");
                            }}
                          >
                            <ArrowDown className="w-3 h-3" />
                            Incluir Abaixo
                          </Button>
                        )}

                        {onReplaceContent && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            onClick={() => {
                                setPendingReplaceContent(msg.content);
                                setReplaceDialogOpen(true);
                            }}
                          >
                            <RefreshCw className="w-3 h-3" />
                            Substituir Tudo
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-white whitespace-pre-wrap break-words overflow-hidden leading-relaxed">
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sendMutation.isPending && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-red-600" />
                </div>
                <div className="rounded-lg px-3 py-2 bg-slate-100">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 bg-white shrink-0">
        <div className="relative">
            <Textarea
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[80px] pr-10 text-sm" 
            />
            <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            className="absolute bottom-2 right-2 h-7 w-7 bg-red-600 hover:bg-red-700"
            >
            {sendMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
                <Send className="w-3.5 h-3.5" />
            )}
            </Button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          Pressione Enter para enviar • Shift+Enter para pular linha
        </p>
      </div>

      {/* Alert Dialog for Replace Confirmation */}
      <AlertDialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <AlertDialogTitle className="text-lg">Substituir Roteiro</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600">
              Tem certeza que deseja substituir <strong>TODO</strong> o roteiro atual por este conteúdo? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (pendingReplaceContent && onReplaceContent) {
                  onReplaceContent(pendingReplaceContent);
                  toast.success("Roteiro substituído com sucesso");
                }
                setPendingReplaceContent(null);
              }}
            >
              Sim, Substituir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}