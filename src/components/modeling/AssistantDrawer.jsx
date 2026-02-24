import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Trash2, BrainCircuit, User, Bot, Copy, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon, callFunction } from "@/api/neonClient";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';

export default function AssistantDrawer({ open, onOpenChange, modelingId }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const scrollRef = useRef(null);

  // Fetch dossier
  const { data: dossier } = useQuery({
    queryKey: ['modelingDossier', modelingId],
    queryFn: async () => {
      const dossiers = await neon.entities.ContentDossier.filter({ modeling_id: modelingId }, '-created_date', 1);
      return dossiers[0] || null;
    },
    enabled: !!modelingId && open
  });

  // Fetch chat history
  const { data: chatHistory = [], isLoading } = useQuery({
    queryKey: ['modelingChat', modelingId],
    queryFn: () => neon.entities.ModelingChat.filter({ modeling_id: modelingId }, 'created_date', 100),
    enabled: !!modelingId && open
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (userMessage) => {
      // Assistente de Ideias
      const configs = await neon.entities.ModelingAssistantConfig.list();
      const config = configs?.[0];

      const model = config?.config?.model || 'openai/gpt-4o-mini';
      const systemPrompt = config?.config?.prompt || `Você é um Assistente de Estratégia de Conteúdo para YouTube. Use o contexto fornecido (transcrições, textos, notas) para ajudar o usuário a ter ideias, analisar ângulos e estruturar tópicos para um novo vídeo. Seja um parceiro de brainstorming.`;

      // Buscar contexto da modelagem
      const modeling = await neon.entities.Modeling.filter({ id: modelingId });
      
      // Buscar análises dos materiais
      const analyses = await neon.entities.ModelingAnalysis.filter({ 
        modeling_id: modelingId,
        status: 'completed'
      });

      // Montar contexto
      let contexto = '';
      
      // Contexto normal
      contexto = `# MODELAGEM: ${modeling[0]?.title || 'Sem título'}\n\n`;
      
      if (modeling[0]?.description) {
        contexto += `**Descrição:** ${modeling[0].description}\n\n`;
      }
      if (modeling[0]?.target_platform) {
        contexto += `**Plataforma:** ${modeling[0].target_platform}\n`;
      }
      if (modeling[0]?.content_type) {
        contexto += `**Tipo:** ${modeling[0].content_type}\n\n`;
      }
      if (modeling[0]?.creator_idea) {
        contexto += `## 💡 Ideia do Criador\n${modeling[0].creator_idea}\n\n`;
      }

      // Usar análises se disponíveis, senão usar materiais brutos
      if (analyses.length > 0) {
        contexto += `## 📊 ANÁLISES DOS MATERIAIS (${analyses.length})\n\n`;
        
        analyses.forEach((analysis, i) => {
          contexto += `### ${i + 1}. ${analysis.material_title || 'Sem título'} (${analysis.material_type})\n\n`;
          contexto += `${analysis.analysis_summary}\n\n`;
          contexto += `---\n\n`;
        });
      } else {
        // Fallback: buscar materiais brutos
        const videos = await neon.entities.ModelingVideo.filter({ modeling_id: modelingId });
        const texts = await neon.entities.ModelingText.filter({ modeling_id: modelingId });
        const links = await neon.entities.ModelingLink.filter({ modeling_id: modelingId });

        const transcribedVideos = videos.filter(v => v.status === 'transcribed' && v.transcript);
        if (transcribedVideos.length > 0) {
          contexto += `## 🎥 VÍDEOS TRANSCRITOS (${transcribedVideos.length})\n\n`;
          transcribedVideos.forEach((v, i) => {
            contexto += `### Vídeo ${i + 1}: ${v.title || 'Sem título'}\n\n`;
            if (v.channel_name) contexto += `**Canal:** ${v.channel_name}\n`;
            if (v.notes) contexto += `**Notas:** ${v.notes}\n\n`;
            const transcriptPreview = v.transcript.length > 3000 
              ? v.transcript.substring(0, 3000) + '\n\n_[transcrição truncada]_' 
              : v.transcript;
            contexto += `**Transcrição:**\n${transcriptPreview}\n\n---\n\n`;
          });
        }

        if (texts.length > 0) {
          contexto += `## 📄 TEXTOS (${texts.length})\n\n`;
          texts.forEach((t, i) => {
            contexto += `### Texto ${i + 1}: ${t.title || 'Sem título'}\n\n`;
            if (t.description) contexto += `**Descrição:** ${t.description}\n\n`;
            const contentPreview = t.content.length > 2000 
              ? t.content.substring(0, 2000) + '\n\n_[texto truncado]_' 
              : t.content;
            contexto += `${contentPreview}\n\n---\n\n`;
          });
        }

        const completedLinks = links.filter(l => l.status === 'completed' && l.summary);
        if (completedLinks.length > 0) {
          contexto += `## 🔗 LINKS PROCESSADOS (${completedLinks.length})\n\n`;
          completedLinks.forEach((l, i) => {
            contexto += `### Link ${i + 1}: ${l.title || l.url}\n\n`;
            if (l.notes) contexto += `**Notas:** ${l.notes}\n\n`;
            contexto += `**Resumo:**\n${l.summary}\n\n---\n\n`;
          });
        }

        if (transcribedVideos.length === 0 && texts.length === 0 && completedLinks.length === 0) {
          contexto += `_Nenhum material processado ainda. Adicione e processe vídeos, textos ou links para começar._\n\n`;
        }
      }

      // Adicionar histórico do chat ao contexto
      if (chatHistory.length > 0) {
        contexto += `## 💬 Histórico da Conversa\n\n`;
        chatHistory.forEach((msg) => {
          const role = msg.role === 'user' ? 'Usuário' : 'Assistente';
          contexto += `**${role}:** ${msg.content}\n\n`;
        });
      }

      // Preparar mensagens
      const messages = [
        { role: 'system', content: systemPrompt.replace(/\{\{contexto_modelagem\}\}/g, contexto) },
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ];

      // Chamar OpenRouter via backend
      const data = await callFunction('openrouter', {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      });

      const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('Resposta inválida da API');
      }

      // Salvar mensagens
      await neon.entities.ModelingChat.create({
        modeling_id: modelingId,
        role: 'user',
        content: userMessage
      });

      await neon.entities.ModelingChat.create({
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
      const messages = await neon.entities.ModelingChat.filter({ modeling_id: modelingId });
      await Promise.all(messages.map(m => neon.entities.ModelingChat.delete(m.id)));
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

  const handleCopyLastResponse = () => {
    const lastAssistantMessage = chatHistory.filter(m => m.role === 'assistant').pop();
    if (lastAssistantMessage) {
      navigator.clipboard.writeText(lastAssistantMessage.content);
      toast.success('Resposta copiada!');
    }
  };

  const handleSaveResearch = async () => {
    const lastAssistantMessage = chatHistory.filter(m => m.role === 'assistant').pop();
    if (lastAssistantMessage) {
      await neon.entities.ModelingText.create({
        modeling_id: modelingId,
        title: `Deep Research - ${new Date().toLocaleDateString()}`,
        description: 'Resultado de pesquisa profunda',
        content: lastAssistantMessage.content,
        text_type: 'research',
        character_count: lastAssistantMessage.content.length,
        token_estimate: Math.ceil(lastAssistantMessage.content.length / 4)
      });

      queryClient.invalidateQueries({ queryKey: ['modelingTexts', modelingId] });
      toast.success('Pesquisa salva como texto!');
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
          <div className="flex items-center justify-between mb-4">
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

          <p className="text-sm text-slate-500">
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
              className="bg-amber-600 hover:bg-amber-700 shrink-0"
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