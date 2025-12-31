import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Trash2, Bot, User, MessageSquareText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { sendMessage } from "@/components/services/OpenRouterDirectService";

export default function YoutubeScriptChatDrawer({ open, onOpenChange, scriptId, scriptContext }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);

  // Fetch chat history
  const { data: chatHistory = [], isLoading } = useQuery({
    queryKey: ['youtubeScriptChat', scriptId],
    queryFn: () => base44.entities.YoutubeScriptChat.filter({ script_id: scriptId }, 'created_date', 100),
    enabled: !!scriptId && open
  });

  // Get Agent Config for Model
  const { data: agentConfig } = useQuery({
    queryKey: ['youtubeGeneratorConfig'],
    queryFn: async () => {
      const configs = await base44.entities.YoutubeGeneratorConfig.list();
      return configs[0];
    },
    enabled: open
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[500px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <MessageSquareText className="w-5 h-5 text-red-600" />
              </div>
              <SheetTitle>Chat do Roteiro</SheetTitle>
            </div>
            {chatHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <p className="text-sm text-slate-500">
            Converse com a IA para ter ideias ou editar este roteiro.
          </p>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquareText className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">
                Nenhuma mensagem ainda.<br />Comece perguntando algo sobre o roteiro!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="p-2 rounded-full bg-red-100 shrink-0 h-fit">
                      <Bot className="w-4 h-4 text-red-600" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="p-2 rounded-full bg-slate-200 shrink-0 h-fit">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="p-2 rounded-full bg-red-100 shrink-0 h-fit">
                    <Bot className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-slate-100">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t shrink-0 space-y-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="resize-none"
              rows={3}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
              className="bg-red-600 hover:bg-red-700 shrink-0"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            Pressione Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}