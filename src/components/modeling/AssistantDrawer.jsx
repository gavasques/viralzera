import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Trash2, BrainCircuit, User, Bot } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AssistantDrawer({ open, onOpenChange, modelingId }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);

  // Fetch chat history
  const { data: chatHistory = [], isLoading } = useQuery({
    queryKey: ['modelingChat', modelingId],
    queryFn: () => base44.entities.ModelingChat.filter({ modeling_id: modelingId }, 'created_date', 100),
    enabled: !!modelingId && open
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (userMessage) => {
      // Buscar configuração do agente
      const configs = await base44.entities.ModelingAssistantConfig.list();
      const config = configs?.[0];

      const model = config?.model || 'openai/gpt-4o-mini';
      const systemPrompt = config?.prompt || `Você é um Assistente de Estratégia de Conteúdo para YouTube. Use o contexto fornecido (transcrições, textos, notas) para ajudar o usuário a ter ideias, analisar ângulos e estruturar tópicos para um novo vídeo. Seja um parceiro de brainstorming.`;

      // Buscar contexto da modelagem
      const modeling = await base44.entities.Modeling.filter({ id: modelingId });
      
      // Buscar análises dos materiais
      const analyses = await base44.entities.ModelingAnalysis.filter({ 
        modeling_id: modelingId,
        status: 'completed'
      });

      // Montar contexto com base nas análises
      let contexto = `# MODELAGEM: ${modeling[0]?.title || 'Sem título'}\n\n`;
      
      if (modeling[0]?.creator_idea) {
        contexto += `## 💡 Ideia do Criador\n${modeling[0].creator_idea}\n\n`;
      }

      if (analyses.length > 0) {
        contexto += `## 📊 ANÁLISES DOS MATERIAIS (${analyses.length})\n\n`;
        
        analyses.forEach((analysis, i) => {
          contexto += `### ${i + 1}. ${analysis.material_title || 'Sem título'} (${analysis.material_type})\n\n`;
          contexto += `${analysis.analysis_summary}\n\n`;
          contexto += `---\n\n`;
        });
      } else {
        contexto += `_Nenhuma análise de material disponível ainda. Os materiais precisam ser processados primeiro._\n\n`;
      }

      // Adicionar histórico do chat ao contexto
      if (chatHistory.length > 0) {
        contexto += `## 💬 Histórico da Conversa\n\n`;
        chatHistory.forEach((msg) => {
          const role = msg.role === 'user' ? 'Usuário' : 'Assistente';
          contexto += `**${role}:** ${msg.content}\n\n`;
        });
      }

      // Buscar API key
      const userConfigs = await base44.entities.UserConfig.list();
      const apiKey = userConfigs[0]?.openrouter_api_key;

      if (!apiKey) {
        throw new Error('Configure sua API Key do OpenRouter');
      }

      // Preparar mensagens
      const messages = [
        { role: 'system', content: systemPrompt.replace(/\{\{contexto_modelagem\}\}/g, contexto).replace(/\{\{historico_chat\}\}/g, JSON.stringify(chatHistory.reverse())) },
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ];

      // Chamar OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ContentAI - Modeling Assistant'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('Resposta inválida da API');
      }

      // Salvar mensagens
      await base44.entities.ModelingChat.create({
        modeling_id: modelingId,
        role: 'user',
        content: userMessage
      });

      await base44.entities.ModelingChat.create({
        modeling_id: modelingId,
        role: 'assistant',
        content: assistantMessage,
        usage: data.usage
      });

      return { message: assistantMessage, usage: data.usage };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingChat', modelingId] });
      setMessage('');
    },
    onError: (error) => {
      toast.error('Erro ao enviar mensagem: ' + error.message);
    }
  });

  // Clear chat mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      const messages = await base44.entities.ModelingChat.filter({ modeling_id: modelingId });
      await Promise.all(messages.map(m => base44.entities.ModelingChat.delete(m.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingChat', modelingId] });
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

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[500px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <BrainCircuit className="w-5 h-5 text-amber-600" />
              </div>
              <SheetTitle>Assistente de Ideias</SheetTitle>
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
          <p className="text-sm text-slate-500 mt-2">
            Use as transcrições e textos desta modelagem para ter ideias
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
              <BrainCircuit className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">
                Comece uma conversa para ter ideias baseadas no conteúdo desta modelagem
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
                    <div className="p-2 rounded-full bg-amber-100 shrink-0 h-fit">
                      <Bot className="w-4 h-4 text-amber-600" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      msg.role === 'user'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
                  <div className="p-2 rounded-full bg-amber-100 shrink-0 h-fit">
                    <Bot className="w-4 h-4 text-amber-600" />
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
        <div className="p-4 border-t shrink-0">
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
              className="bg-amber-600 hover:bg-amber-700 shrink-0"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Pressione Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}