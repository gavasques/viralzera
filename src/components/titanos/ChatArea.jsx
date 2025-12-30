/**
 * Área principal do chat com múltiplas colunas de modelos
 */

import React, { memo, useMemo } from 'react';
import ChatColumn from '../ChatColumn';
import NoModelsState from '../NoModelsState';
import { getMessagesForModel } from '../services/messageService';

function ChatArea({ 
  visibleModels, 
  messages, 
  isLoading, 
  regeneratingModel, 
  getAlias, 
  onHide, 
  onRemove, 
  onRegenerate, 
  onExpand, 
  isAdmin, 
  conversationId 
}) {
  // Memoiza mensagens por modelo para evitar recálculos
  const messagesByModel = useMemo(() => {
    const map = {};
    visibleModels.forEach(modelId => {
      map[modelId] = getMessagesForModel(messages, modelId);
    });
    return map;
  }, [visibleModels, messages]);

  return (
    <div className="flex-1 relative min-h-0 bg-slate-50/30">
      <div className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200">
        <div className="h-full flex p-0 divide-x divide-slate-200/50 min-w-full">
          {visibleModels.length === 0 ? (
            <NoModelsState />
          ) : (
            visibleModels.map(modelId => (
              <ChatColumn 
                key={modelId}
                modelId={modelId}
                modelName={getAlias(modelId)}
                messages={messagesByModel[modelId] || []}
                isLoading={isLoading || regeneratingModel === modelId}
                onHide={() => onHide(modelId)}
                onRemove={() => onRemove(modelId)}
                onRegenerate={() => onRegenerate(modelId)}
                onExpand={() => onExpand(modelId)}
                isAdmin={isAdmin}
                conversationId={conversationId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ChatArea);