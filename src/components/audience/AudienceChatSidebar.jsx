import React from 'react';
import { ChatSidebar } from '@/components/chat';

/**
 * Sidebar específica para o chat de público-alvo
 * Wrapper do ChatSidebar unificado
 */
export default function AudienceChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite
}) {
  return (
    <ChatSidebar
      sessions={sessions}
      activeSessionId={activeSessionId}
      onSelectSession={onSelectSession}
      onNewSession={onNewSession}
      onDeleteSession={onDeleteSession}
      onRenameSession={onRenameSession}
      onToggleFavorite={onToggleFavorite}
      title="Públicos"
      newButtonLabel="Novo Público"
    />
  );
}