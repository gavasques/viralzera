/**
 * Modal para chat expandido com modelo único
 */

import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, Loader2, X } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { useSingleModelChat } from './hooks/useSendMessage';
import { getMessagesForModel } from './services/messageService';

function SingleModelChatModal({ 
  open, 
  onOpenChange, 
  modelId, 
  modelName,
  conversationId,
  messages = [],
  allMessages = []
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  
  const { sendMessage, isLoading } = useSingleModelChat(conversationId, modelId, allMessages);

  // Filtra mensagens para este modelo
  const filteredMessages = useMemo(() => 
    getMessagesForModel(allMessages, modelId),
    [allMessages, modelId]
  );

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages.length, isLoading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] md:max-w-6xl h-[90vh] flex flex-col p-0 gap-0 border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/95 backdrop-blur-xl">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-slate-100 bg-white/80 shrink-0 backdrop-blur-md z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 transform hover:scale-105 transition-transform duration-300">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                  {modelName || modelId}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs text-slate-500 font-medium font-mono bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {modelId}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 bg-slate-50/30">
          <div className="p-4 space-y-4">
            {filteredMessages.length === 0 ? (
              <EmptyMessages />
            ) : (
              filteredMessages.map((msg, idx) => (
                <MessageBubble 
                  key={msg.id || idx}
                  role={msg.role}
                  content={msg.content}
                  metrics={msg.metrics}
                  modelName={msg.role === 'assistant' ? modelName : 'Você'}
                  isInitialPrompt={msg.role === 'user' && idx === 0 && filteredMessages.length > 1}
                  chatTitle={modelName}
                />
              ))
            )}
            {isLoading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:shadow-xl focus-within:shadow-indigo-100/50 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all duration-300">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Converse exclusivamente com ${modelName || modelId}...`}
                className="min-h-[80px] pr-16 py-4 pl-5 w-full resize-none bg-transparent border-0 focus:ring-0 text-base placeholder:text-slate-400"
                onKeyDown={handleKeyDown}
              />
              <div className="absolute bottom-3 right-3">
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-3 font-medium flex items-center justify-center gap-2">
              <Bot className="w-3 h-3" />
              Essa conversa é isolada e não afeta o histórico principal
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const EmptyMessages = memo(() => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
    <Bot className="w-10 h-10 mb-3 opacity-30" />
    <p className="text-sm">Nenhuma mensagem ainda</p>
  </div>
));
EmptyMessages.displayName = 'EmptyMessages';

const LoadingIndicator = memo(() => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
    </div>
    <div className="bg-white border rounded-2xl rounded-tl-none p-4 shadow-sm">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
));
LoadingIndicator.displayName = 'LoadingIndicator';

export default memo(SingleModelChatModal);