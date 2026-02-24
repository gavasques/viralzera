import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, MessageSquare, Trash2, MoreVertical, Star, StarOff, 
  Pencil, Clock, Search
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Sidebar unificada para chats
 * 
 * Props:
 * - sessions: Array de sessões
 * - activeSessionId: ID da sessão ativa
 * - onSelectSession: Callback ao selecionar sessão
 * - onNewSession: Callback para nova sessão
 * - onDeleteSession: Callback para deletar sessão
 * - onRenameSession: Callback para renomear sessão
 * - onToggleFavorite: Callback para favoritar/desfavoritar
 * - title: Título da sidebar
 * - newButtonLabel: Label do botão de nova sessão
 */
export default function ChatSidebar({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  title = "Histórico",
  newButtonLabel = "Nova Conversa",
  hasMore = false,
  onLoadMore = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [renameDialog, setRenameDialog] = useState({ open: false, session: null });
  const [newTitle, setNewTitle] = useState('');

  // Separa favoritos dos demais
  const favoriteSessions = sessions.filter(s => s.is_favorite);
  const regularSessions = sessions.filter(s => !s.is_favorite);

  // Filtra por termo de busca
  const filterSessions = (list) => {
    if (!searchTerm.trim()) return list;
    return list.filter(s => 
      s.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredFavorites = filterSessions(favoriteSessions);
  const filteredRegular = filterSessions(regularSessions);

  const handleRename = () => {
    if (!newTitle.trim() || !renameDialog.session) return;
    onRenameSession?.(renameDialog.session.id, newTitle.trim());
    setRenameDialog({ open: false, session: null });
    setNewTitle('');
  };

  const openRenameDialog = (session) => {
    setNewTitle(session.title || '');
    setRenameDialog({ open: true, session });
  };

  const SessionItem = ({ session }) => {
    const isActive = activeSessionId === session.id;
    
    return (
      <div
        className={`
          group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all
          ${isActive 
            ? 'bg-pink-50 border border-pink-200' 
            : 'hover:bg-slate-50 border border-transparent'}
        `}
        onClick={() => onSelectSession(session.id)}
      >
        <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-pink-600' : 'text-slate-400'}`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`text-sm font-medium truncate ${isActive ? 'text-pink-900' : 'text-slate-700'}`}>
              {session.title || 'Sem título'}
            </p>
            {session.is_favorite && (
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(session.created_date), { addSuffix: true, locale: ptBR })}</span>
            {session.messages?.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {session.messages.length}
              </Badge>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => openRenameDialog(session)}>
              <Pencil className="w-4 h-4 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleFavorite?.(session.id, !session.is_favorite)}>
              {session.is_favorite ? (
                <>
                  <StarOff className="w-4 h-4 mr-2" />
                  Desfavoritar
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Favoritar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600"
              onClick={() => onDeleteSession?.(session.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <Button 
          onClick={onNewSession}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200 gap-2"
        >
          <Plus className="w-4 h-4" />
          {newButtonLabel}
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {/* Favoritos */}
          {filteredFavorites.length > 0 && (
            <div className="mb-4">
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                Favoritos
              </p>
              {filteredFavorites.map(session => (
                <SessionItem key={session.id} session={session} />
              ))}
            </div>
          )}

          {/* Recentes */}
          {filteredRegular.length > 0 && (
            <div>
              {filteredFavorites.length > 0 && (
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Recentes
                </p>
              )}
              {filteredRegular.map(session => (
                <SessionItem key={session.id} session={session} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma conversa ainda</p>
            </div>
          )}

          {/* No Results */}
          {sessions.length > 0 && filteredFavorites.length === 0 && filteredRegular.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum resultado encontrado</p>
            </div>
          )}

          {/* Load More */}
          {hasMore && !searchTerm && (
            <div className="pt-2 pb-4 px-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs text-slate-500"
                onClick={onLoadMore}
              >
                Ver mais conversas
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Rename Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ open, session: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear Conversa</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Novo título..."
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, session: null })}>
              Cancelar
            </Button>
            <Button onClick={handleRename} className="bg-pink-600 hover:bg-pink-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}