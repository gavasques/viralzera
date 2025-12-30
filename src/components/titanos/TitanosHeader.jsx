/**
 * Header da conversa no Multi Chat
 */

import React, { memo } from 'react';
import ConversationMetricsButton from './ConversationMetricsButton';
import ModelSelector from './ModelSelector';

function TitanosHeader({ conversation, messages, selectedModels, onModelsChange }) {
  if (!conversation) return null;

  return (
    <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-slate-800 truncate max-w-[300px]">
          {conversation.title}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        {messages.length > 0 && (
          <ConversationMetricsButton messages={messages} selectedModels={selectedModels} />
        )}
        <div className="h-4 w-px bg-slate-200 mx-1" />
        <ModelSelector selectedModels={selectedModels} onSelectionChange={onModelsChange} />
      </div>
    </div>
  );
}

export default memo(TitanosHeader);