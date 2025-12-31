import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Copy, 
  Check, 
  Plus,
  History,
  ChevronLeft,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { getAgentConfig } from "@/components/constants/agentConfigs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CanvasAIPanel({ 
  canvasId,
  canvasContent, 
  canvasTitle,
  onApplyContent,
  onClose,
  embedded = false
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['CanvasConfig', 'global'],
    queryFn: async () => {
      const configs = await base44.entities.CanvasConfig.list('-created_date', 1);
      return configs[0] || null;
    },
    staleTime: 1000 * 60 * 5
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['canvasChatSessions', canvasId],
    queryFn: () => base44.entities.CanvasChatSession.filter({ canvas_id: canvasId }, '-updated_date', 50),
    enabled: !!canvasId
  });

  const agentConfig = getAgentConfig('canvas');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const saveSessionMutation = useMutation({
    mutationFn: async ({ sessionId, messages, title }) => {
      if (sessionId) {
        return base44.entities.CanvasChatSession.update(sessionId, { messages, title });
      } else {
        return base44.entities.CanvasChatSession.create({
          canvas_id: canvasId,
          messages,
          title: title || 'Nova conversa'
        });
      }
    },
    onSuccess: (data) => {
      if (!currentSessionId && data?.id) {
        setCurrentSessionId(data.id);
      }
      queryClient.invalidateQueries({ queryKey: ['canvasChatSessions', canvasId] });
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id) => base44.entities.CanvasChatSession.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvasChatSessions', canvasId] });
      if (currentSessionId) {
        handleNewSession();
      }
      toast.success("Conversa excluída!");
    }
  });

  const autoSave = useCallback((newMessages) => {
    if (newMessages.length > 0 && canvasId) {
      const title = newMessages[0]?.content?.substring(0, 50) || 'Nova conversa';
      saveSessionMutation.mutate({ 
        sessionId: currentSessionId, 
        messages: newMessages,
        title
      });
    }
  }, [currentSessionId, canvasId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const systemPrompt = (config?.prompt || agentConfig.defaultPrompt)
        .replace('{{CANVAS_CONTENT}}', canvasContent || '');

      const apiMessages = [
        { 
          role: 'system', 
          content: `${systemPrompt}\n\n---\n\n**CONTEÚDO ATUAL DO CANVAS:**\nTítulo: ${canvasTitle || 'Sem título'}\n\n${canvasContent || '(vazio)'}`
        },
        ...newMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      // Busca API Key do usuário
      const userConfigs = await base44.entities.UserConfig.list();
      const apiKey = userConfigs?.[0]?.openrouter_api_key;
      
      if (!apiKey) {
        throw new Error('Configure sua API Key do OpenRouter em Configurações');
      }

      const body = {
        model: config?.model || 'openai/gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 4096,
      };

      if (config?.enable_web_search) {
        body.plugins = [{ id: 'web' }];
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Canvas AI',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data?.choices?.[0]?.message?.content;
      
      if (assistantContent) {
        const finalMessages = [...newMessages, { role: 'assistant', content: assistantContent }];
        setMessages(finalMessages);
        autoSave(finalMessages);
      } else {
        throw new Error('Resposta vazia da IA');
      }
    } catch (error) {
      console.error('Canvas AI error:', error);
      toast.error('Erro ao processar: ' + (error.message || 'Tente novamente'));
      const errorMessages = [...newMessages, { 
        role: 'assistant', 
        content: '❌ Erro ao processar sua solicitação. Tente novamente.' 
      }];
      setMessages(errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success('Copiado!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApply = (content) => {
    onApplyContent(content);
    toast.success('Conteúdo aplicado ao Canvas!');
  };

  const handleNewSession = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setShowHistory(false);
  };

  const handleLoadSession = (session) => {
    setMessages(session.messages || []);
    setCurrentSessionId(session.id);
    setShowHistory(false);
  };

  const quickActions = [
    { label: '✨ Melhorar texto', prompt: 'Melhore a clareza e fluidez deste texto, mantendo o mesmo tom.' },
    { label: '📝 Resumir', prompt: 'Resuma o conteúdo principal em um parágrafo objetivo.' },
    { label: '📖 Expandir', prompt: 'Expanda este conteúdo com mais detalhes e exemplos.' },
    { label: '✅ Corrigir', prompt: 'Corrija erros de gramática e ortografia.' },
    { label: '🎯 Criar gancho', prompt: 'Crie um gancho inicial poderoso para prender a atenção do leitor.' },
    { label: '💡 Gerar ideias', prompt: 'Sugira 5 variações ou abordagens diferentes para este conteúdo.' },
    { label: '🔥 Tom persuasivo', prompt: 'Reescreva com tom mais persuasivo e convincente.' },
    { label: '😊 Tom leve', prompt: 'Reescreva com tom mais leve, casual e descontraído.' },
    { label: '📊 Adicionar dados', prompt: 'Sugira dados, estatísticas ou exemplos que poderiam enriquecer este conteúdo.' },
    { label: '🎬 Roteiro', prompt: 'Transforme este conteúdo em um roteiro de vídeo com marcações de tempo.' },
  ];

  // History View
  if (showHistory) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-white">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => setShowHistory(false)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <span className="font-medium text-sm text-slate-700">Histórico</span>
          <div className="w-16" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Nenhuma conversa salva.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                    currentSessionId === session.id 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50'
                  }`}
                  onClick={() => handleLoadSession(session)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {session.title || 'Conversa sem título'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {format(new Date(session.updated_date || session.created_date), "d MMM 'às' HH:mm", { locale: ptBR })}
                        {' • '}{session.messages?.length || 0} msgs
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSessionMutation.mutate(session.id);
                      }}
                      className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="font-medium text-sm text-indigo-900">Assistente IA</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
            title="Ver histórico"
          >
            <History className="w-3.5 h-3.5" />
            {sessions.length > 0 && (
              <span className="ml-1 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full">
                {sessions.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewSession}
            className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
            title="Nova conversa"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nova
          </Button>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center py-4">
            <Sparkles className="w-8 h-8 text-indigo-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">
              Peça para a IA editar ou transformar seu conteúdo
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => setInput(action.prompt)}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 rounded-full transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                          code: ({inline, children}) => inline 
                            ? <code className="bg-slate-200 px-1 rounded text-xs">{children}</code>
                            : <pre className="bg-slate-800 text-slate-100 p-2 rounded text-xs overflow-x-auto my-2"><code>{children}</code></pre>
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      <div className="flex gap-1 mt-2 pt-2 border-t border-slate-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(msg.content, i)}
                          className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
                        >
                          {copiedIndex === i ? (
                            <Check className="w-3 h-3 mr-1 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          Copiar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApply(msg.content)}
                          className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          Aplicar ao Canvas
                        </Button>
                      </div>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="flex-shrink-0 p-3 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Peça para a IA editar o conteúdo..."
            className="min-h-[44px] max-h-[88px] resize-none text-sm flex-1"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 h-[44px] px-4 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}