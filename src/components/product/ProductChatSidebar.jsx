import React from 'react';
import { ChatSidebar } from '@/components/chat';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

/**
 * Sidebar específica para o chat de produtos
 * Wrapper do ChatSidebar unificado com configurações
 */
export default function ProductChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onOpenSettings
}) {
  return (
    <div className="flex flex-col h-full">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={onSelectSession}
        onNewSession={onNewSession}
        onDeleteSession={onDeleteSession}
        onRenameSession={onRenameSession}
        onToggleFavorite={onToggleFavorite}
        title="Análises"
        newButtonLabel="Nova Análise"
      />
      
      {/* Settings Button */}
      {onOpenSettings && (
        <div className="p-3 border-t border-slate-100">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-slate-500 hover:text-slate-700"
            onClick={onOpenSettings}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      )}
    </div>
  );
}