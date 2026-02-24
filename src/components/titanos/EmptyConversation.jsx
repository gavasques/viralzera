import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus } from 'lucide-react';

/**
 * Estado vazio quando nenhuma conversa está selecionada
 */
function EmptyConversation({ onNewConversation }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
      <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-pink-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">
        Nenhuma conversa selecionada
      </h3>
      <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
        Selecione uma conversa existente ou crie uma nova para começar a comparar modelos.
      </p>
      <Button onClick={onNewConversation} className="bg-pink-600 hover:bg-pink-700">
        <Plus className="w-4 h-4 mr-2" /> Nova Conversa
      </Button>
    </div>
  );
}

export default memo(EmptyConversation);