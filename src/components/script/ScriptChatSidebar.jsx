import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, Search, MessageSquare, MoreHorizontal, 
  Trash2, Edit2, Star, StarOff, Settings 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ScriptChatSidebar({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onOpenSettings
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter(s => 
    s.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const favorites = filteredSessions.filter(s => s.is_favorite);
  const regular = filteredSessions.filter(s => !s.is_favorite);

  const handleStartRename = (session) => {
    setEditingId(session.id);
    setEditTitle(session.title || '');
  };

  const handleSaveRename = (id) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const SessionItem = ({ session }) => {
    const isActive = session.id === activeSessionId;
    const isEditing = editingId === session.id;

    return (
      <div
        className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          isActive 
            ? 'bg-pink-50 text-pink-700' 
            : 'hover:bg-slate-50 text-slate-700'
        }`}
        onClick={() => !isEditing && onSelectSession(session.id)}
      >
        <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-pink-500' : 'text-slate-400'}`} />
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => handleSaveRename(session.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(session.id)}
              className="h-6 text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <p className="text-sm font-medium truncate">{session.title || 'Sem título'}</p>
              <p className="text-xs text-slate-400">
                {session.created_date && format(new Date(session.created_date), "dd MMM", { locale: ptBR })}
              </p>
            </>
          )}
        </div>

        {session.is_favorite && (
          <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartRename(session); }}>
              <Edit2 className="w-4 h-4 mr-2" /> Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFavorite(session.id); }}>
              {session.is_favorite ? (
                <><StarOff className="w-4 h-4 mr-2" /> Remover favorito</>
              ) : (
                <><Star className="w-4 h-4 mr-2" /> Favoritar</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Scripts</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onOpenSettings} className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
            <Button onClick={onNewSession} size="sm" className="bg-pink-600 hover:bg-pink-700">
              <Plus className="w-4 h-4 mr-1" /> Novo
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {favorites.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase px-3 mb-2">Favoritos</p>
              <div className="space-y-1">
                {favorites.map(session => (
                  <SessionItem key={session.id} session={session} />
                ))}
              </div>
            </div>
          )}

          <div>
            {favorites.length > 0 && regular.length > 0 && (
              <p className="text-xs font-medium text-slate-400 uppercase px-3 mb-2">Todas</p>
            )}
            <div className="space-y-1">
              {regular.map(session => (
                <SessionItem key={session.id} session={session} />
              ))}
            </div>
          </div>

          {filteredSessions.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              {searchTerm ? 'Nenhum resultado' : 'Nenhum script ainda'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}