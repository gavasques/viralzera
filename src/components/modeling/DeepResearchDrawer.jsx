import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { neon, callFunction } from "@/api/neonClient";
import { toast } from "sonner";
import { Loader2, User, Globe, Trash2, Send, Copy, Save, FileText, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function DeepResearchDrawer({ open, onOpenChange, modelingId }) {
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [isResearching, setIsResearching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch saved researches
  const { data: savedResearches = [] } = useQuery({
    queryKey: ['savedResearches', modelingId],
    queryFn: () => neon.entities.ModelingText.filter({ 
      modeling_id: modelingId,
      text_type: 'research'
    }, '-created_date', 20),
    enabled: !!modelingId && open
  });

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!message.trim() || isResearching) return;

    const userMessage = message.trim();
    setMessage('');
    setIsResearching(true);

    // Add user message
    const newHistory = [...history, { role: 'user', content: userMessage }];
    setHistory(newHistory);

    try {
      // Get config
      const configs = await neon.entities.DeepResearchConfig.list();
      const config = configs?.[0];

      const cfg = config?.config || {};
      if (!cfg.model) {
        throw new Error('Configure o agente Deep Research em Configurações de Agentes');
      }

      const systemPrompt = cfg.prompt || `Você é um assistente de pesquisa avançado. Use Web Search para trazer informações atualizadas.`;

      // Build messages
      const messages = [
        { role: 'system', content: systemPrompt },
        ...newHistory.map(m => ({ role: m.role, content: m.content }))
      ];

      // Call OpenRouter
      const requestBody = {
        model: cfg.model,
        messages,
        temperature: 0.7,
        max_tokens: cfg.max_tokens || 32000
      };

      // Check if model has native web search (Perplexity models)
      const hasNativeWebSearch = cfg.model?.toLowerCase().includes('perplexity') ||
                                  cfg.model?.toLowerCase().includes('sonar');

      // Add web search if enabled
      if (cfg.enable_web_search) {
        if (hasNativeWebSearch) {
          // Use native web search for Perplexity models
          requestBody.web_search_options = {
            enabled: true
          };
        } else {
          // For other models, get web context first
          try {
            const webContext = await neon.integrations.Core.InvokeLLM({
              prompt: `Pesquise na internet sobre: ${userMessage}\n\nRetorne um resumo completo e estruturado das informações mais relevantes e atualizadas.`,
              add_context_from_internet: true
            });
            
            // Add web context to messages
            messages.push({
              role: 'system',
              content: `Contexto adicional da web:\n\n${webContext}`
            });
          } catch (error) {
            console.warn('Web search falhou, continuando sem contexto web:', error);
          }
        }
      }

      // Add reasoning if enabled
      if (config.enable_reasoning) {
        requestBody.reasoning = {
          enabled: true,
          effort: config.reasoning_effort || 'high'
        };
      }

      const data = await callFunction('openrouter', requestBody);
      const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('Resposta inválida da API');
      }

      setHistory([...newHistory, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Erro no Deep Research:', error);
      toast.error('Erro: ' + error.message);
      setHistory(newHistory);
    } finally {
      setIsResearching(false);
    }
  };

  const handleCopy = () => {
    const text = history
      .map(m => `**${m.role === 'user' ? 'Você' : 'Assistente'}:**\n${m.content}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Conversa copiada!');
  };

  const handleSave = async () => {
    if (history.length === 0) {
      toast.error('Nenhuma conversa para salvar');
      return;
    }

    try {
      const content = history
        .map(m => `**${m.role === 'user' ? 'Você' : 'Assistente'}:**\n${m.content}`)
        .join('\n\n---\n\n');

      await neon.entities.ModelingText.create({
        modeling_id: modelingId,
        title: `Deep Research - ${new Date().toLocaleString('pt-BR')}`,
        description: 'Pesquisa avançada',
        content,
        text_type: 'research',
        character_count: content.length,
        token_estimate: Math.ceil(content.length / 4)
      });

      queryClient.invalidateQueries({ queryKey: ['modelingTexts', modelingId] });
      toast.success('Pesquisa salva como texto!');
      setHistory([]);
    } catch (error) {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  const handleClear = () => {
    if (!confirm('Limpar a conversa de Deep Research?')) return;
    setHistory([]);
    toast.success('Conversa limpa!');
  };

  const handleLoadResearch = (research) => {
    // Parse the saved content back into history
    const lines = research.content.split('\n\n---\n\n');
    const newHistory = [];

    for (const line of lines) {
      if (line.includes('**Você:**')) {
        const content = line.replace('**Você:**\n', '').trim();
        if (content) newHistory.push({ role: 'user', content });
      } else if (line.includes('**Assistente:**')) {
        const content = line.replace('**Assistente:**\n', '').trim();
        if (content) newHistory.push({ role: 'assistant', content });
      }
    }

    setHistory(newHistory);
    setShowHistory(false);
    toast.success('Pesquisa carregada!');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Deep Research
            </SheetTitle>
            <div className="flex gap-2">
              {savedResearches.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHistory(!showHistory)}
                  className={showHistory ? 'bg-slate-100' : ''}
                >
                  <Clock className="w-4 h-4" />
                </Button>
              )}
              {history.length > 0 && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Globe className="w-3 h-3 mr-1" />
              Web Search + Reasoning
            </Badge>
          </div>
        </SheetHeader>

        {/* History Sidebar */}
        {showHistory && savedResearches.length > 0 && (
          <div className="border-b bg-slate-50 p-4">
            <h3 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pesquisas Salvas
            </h3>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {savedResearches.map((research) => (
                  <button
                    key={research.id}
                    onClick={() => handleLoadResearch(research)}
                    className="w-full text-left p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-700">
                          {research.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(research.created_date).toLocaleDateString('pt-BR')} às {new Date(research.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Globe className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="font-medium text-slate-900 mb-2">Pesquisa Avançada</h3>
              <p className="text-sm text-slate-500 max-w-md mb-4">
                Faça perguntas complexas que exigem pesquisa na internet. O assistente usa Web Search e raciocínio profundo para trazer respostas completas.
              </p>
              {savedResearches.length > 0 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  Ver {savedResearches.length} pesquisa{savedResearches.length !== 1 ? 's' : ''} salva{savedResearches.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full" ref={scrollRef}>
              <div className="p-6 space-y-4">
                {history.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-xl p-4 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isResearching && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 animate-pulse">
                      <Globe className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-slate-100 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span className="text-xs text-slate-500">Pesquisando na web...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua pergunta para pesquisa avançada..."
              className="min-h-[60px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || isResearching}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}