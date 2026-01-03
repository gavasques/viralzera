import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Trash2, Bot, User, MessageSquareText, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { sendMessage } from "@/components/services/OpenRouterDirectService";

export default function YoutubeAIPanel({ scriptId, scriptContext }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);

  // Fetch chat history
  const { data: chatHistory = [], isLoading } = useQuery({
    queryKey: ['youtubeScriptChat', scriptId],
    queryFn: () => base44.entities.YoutubeScriptChat.filter({ script_id: scriptId }, 'created_date', 100),
    enabled: !!scriptId
  });

  // Get Agent Config for Model
  const { data: agentConfig } = useQuery({
    queryKey: ['youtubeGeneratorConfig'],
    queryFn: async () => {
      const configs = await base44.entities.YoutubeGeneratorConfig.list();
      return configs[0];
    }
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (userMessage) => {
      // 1. Save user message
      await base44.entities.YoutubeScriptChat.create({
        script_id: scriptId,
        role: 'user',
        content: userMessage
      });

      // 2. Prepare context
      const systemPrompt = `Você é um assistente especialista em roteiros do YouTube. 
Você está ajudando o usuário a editar um roteiro específico.

CONTEXTO DO ROTEIRO ATUAL:
Título: ${scriptContext?.title || 'Sem título'}
Tipo: ${scriptContext?.videoType || 'Não definido'}
Status: ${scriptContext?.status || 'Rascunho'}

CONTEÚDO DO ROTEIRO:
${scriptContext?.content || '(Roteiro vazio)'}

MISSÃO:
Ajude o usuário a melhorar, expandir, reescrever ou ter novas ideias para este roteiro.
Seja direto e útil.
Responda em Português do Brasil.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ];

      // 3. Call AI
      const response = await sendMessage({
        model: agentConfig?.model || 'openai/gpt-4o-mini',
        messages: messages,
        options: {
          enableReasoning: agentConfig?.enable_reasoning,
          reasoningEffort: agentConfig?.reasoning_effort,
          feature: 'YoutubeScriptChat'
        }
      });

      // 4. Save assistant message
      await base44.entities.YoutubeScriptChat.create({
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
      const msgs = await base44.entities.YoutubeScriptChat.filter({ script_id: scriptId });
      await Promise.all(msgs.map(m => base44.entities.YoutubeScriptChat.delete(m.id)));
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
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-semibold text-slate-700">Assistente IA</h3>
        </div>
        {chatHistory.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-red-500"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            title="Limpar chat"
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-slate-600 font-medium text-sm mb-1">Como posso ajudar?</p>
            <p className="text-slate-400 text-xs max-w-[200px]">
              Peça ideias, melhorias ou edições para seu roteiro.
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
                  className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 break-words">
                      <ReactMarkdown>
                        {msg.content?.replace(/\n/g, '  \n')}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-0 break-words text-white">
                      <ReactMarkdown>
                        {msg.content?.replace(/\n/g, '  \n')}
                      </ReactMarkdown>
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
    </div>
  );
}