/**
 * Área de input do Multi Chat
 */

import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

function TitanosInputArea({ input, setInput, isLoading, onSend }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  const handleChange = useCallback((e) => {
    setInput(e.target.value);
  }, [setInput]);

  const isDisabled = isLoading || !input.trim();

  return (
    <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto relative group">
        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:shadow-md focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-50/50 transition-all duration-300">
          <Textarea 
            value={input}
            onChange={handleChange}
            placeholder="Digite sua mensagem para todos os modelos..."
            className="min-h-[70px] max-h-[220px] pr-14 py-4 pl-4 w-full resize-none bg-transparent border-0 focus:ring-0 text-base placeholder:text-slate-400"
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2">
            <Button 
              onClick={onSend}
              disabled={isDisabled}
              size="icon"
              className="h-9 w-9 rounded-xl bg-pink-600 hover:bg-pink-700 text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="text-center mt-3">
        <p className="text-[10px] text-slate-400 font-medium">
          Pressione Enter para enviar • Shift + Enter para nova linha
        </p>
      </div>
    </div>
  );
}

export default memo(TitanosInputArea);