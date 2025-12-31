/**
 * Header da conversa no Multi Chat
 */

import React, { memo, useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConversationMetricsButton from './ConversationMetricsButton';
import ModelSelector from './ModelSelector';
import RefinerLogModal from './RefinerLogModal';

function TitanosHeader({ conversation, messages, selectedModels, onModelsChange, isAdmin }) {
  const [showLogModal, setShowLogModal] = useState(false);
  
  if (!conversation) return null;

  const hasRefinerLog = conversation.refiner_log && conversation.source === 'multiscript_wizard';

  return (
    <>
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-slate-800 truncate max-w-[300px]">
            {conversation.title}
          </h2>
          {conversation.source === 'multiscript_wizard' && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              Multi Script
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Botão de Log do Refinador (apenas admin e se tiver log) */}
          {isAdmin && hasRefinerLog && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogModal(true)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50 gap-2"
            >
              <FileText className="w-4 h-4" />
              Ver Log
            </Button>
          )}
          <ModelSelector selectedModels={selectedModels} onSelectionChange={onModelsChange} />
        </div>
      </div>

      {/* Modal de Log */}
      <RefinerLogModal 
        open={showLogModal} 
        onOpenChange={setShowLogModal} 
        log={conversation.refiner_log} 
      />
    </>
  );
}

export default memo(TitanosHeader);