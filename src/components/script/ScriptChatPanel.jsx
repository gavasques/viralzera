import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Loader2, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

export default function ScriptChatPanel({
  session,
  onUpdateSession,
  focusId,
  onNewSession
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const messages = session?.messages || [];

  // Fetch config
  const { data: configs = [] } = useQuery({
    queryKey: ['scriptConfig'],
    queryFn: () => base44.entities.ScriptConfig.list(),
  });
  const config = configs[0];

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !session || isLoading) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    onUpdateSession({ ...session, messages: updatedMessages });
    setInput('');
    setIsLoading(true);

    try {
      const response = await base44.functions.invoke('openrouterChat', {
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        systemPrompt: config?.prompt || "Você é um roteirista profissional especializado em criar scripts virais e engajadores.",
        model: config?.model || "openai/gpt-4o-mini"
      });

      const assistantMessage = {
        role: "assistant",
        content: response.data?.content || response.data?.message || "Desculpe, não consegui processar sua mensagem.",
        timestamp: new Date().toISOString()
      };

      onUpdateSession({ ...session, messages: [...updatedMessages, assistantMessage] });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente.",
        timestamp: new Date().toISOString()
      };
      onUpdateSession({ ...session, messages: [...updatedMessages, errorMessage] });
    } finally {
      setIsLoading(false);
    }
  }, [input, session, messages, config, onUpdateSession, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-pink-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Gerador de Scripts</h3>
            <p className="text-sm text-slate-500 mt-1">
              Selecione ou crie um script para começar
            </p>
          </div>
          <Button onClick={onNewSession} className="bg-pink-600 hover:bg-pink-700">
            <Sparkles className="w-4 h-4 mr-2" /> Novo Script
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-pink-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-pink-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-pink-600" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o script que você quer criar..."
            className="min-h-[60px] max-h-[150px] resize-none"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="bg-pink-600 hover:bg-pink-700 h-auto"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}