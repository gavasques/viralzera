/**
 * Área de chat com colunas de modelos
 */

import React, { memo } from 'react';
import ChatColumn from './ChatColumn';
import NoModelsState from './NoModelsState';

function TitanosChatArea({ 
  visibleModels, 
  messages, 
  isLoading, 
  regeneratingModel, 
  getAlias, 
  getMessagesForModel,
  onHide, 
  onRemove, 
  onRegenerate, 
  onExpand, 
  isAdmin, 
  conversationId,
  promptLog,
  onShowLog
}) {
  return (
    <div className="flex-1 relative min-h-0 bg-slate-50/30">
      <div className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200">
        <div className="h-full flex p-0 divide-x divide-slate-200/50 min-w-full">
          {visibleModels.length === 0 ? (
            <NoModelsState />
          ) : (
            visibleModels.map(recordId => (
              <ChatColumn 
                key={recordId}
                modelId={recordId}
                modelName={getAlias(recordId)}
                messages={getMessagesForModel(recordId)}
                isLoading={isLoading || regeneratingModel === recordId}
                onHide={() => onHide(recordId)}
                onRemove={() => onRemove(recordId)}
                onRegenerate={() => onRegenerate(recordId)}
                onExpand={() => onExpand(recordId)}
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

export default memo(TitanosChatArea);