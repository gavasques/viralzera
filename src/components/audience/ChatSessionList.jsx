import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ChatSessionList({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewSession,
  onDeleteSession 
}) {
  return (
    <div className="w-64 border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b">
        <Button 
          onClick={onNewSession} 
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Sessão
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nenhuma sessão ainda
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`p-3 rounded-lg cursor-pointer group transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                      activeSessionId === session.id ? 'text-indigo-600' : 'text-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(session.created_date), "dd MMM, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {session.status === 'completed' && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}