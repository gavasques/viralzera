import React from 'react';
import { ChatSidebar } from '@/components/chat';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

/**
 * Sidebar específica para o chat de scripts
 * Wrapper do ChatSidebar unificado com configurações
 */
export default function ScriptChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  hasMore,
  onLoadMore
}) {
  return (
    <div className="flex flex-col h-full border-r border-slate-200 bg-white">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={onSelectSession}
          onNewSession={onNewSession}
          onDeleteSession={onDeleteSession}
          onRenameSession={onRenameSession}
          onToggleFavorite={onToggleFavorite}
          title="Scripts"
          newButtonLabel="Novo Script"
          hasMore={hasMore}
          onLoadMore={onLoadMore}
        />
      </div>
      

    </div>
  );
}