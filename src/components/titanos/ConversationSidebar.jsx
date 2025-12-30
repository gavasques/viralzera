import React, { useState, useMemo, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, MoreVertical, FolderPlus, Folder, ChevronRight, ChevronDown,
  Pencil, ArrowRightLeft, Trash2, Star, StarOff, Search, X,
  ChevronDownCircle, ScrollText
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ConversationCard from './ConversationCard';
import GroupSettingsModal from './GroupSettingsModal';

// Hooks
import { useTitanosGroups } from './hooks/useTitanosData';
import { useGroupMutations, useChatMutations } from './hooks/useTitanosMutations';

function ConversationSidebar({ conversations, activeId, onNew, onNewInGroup, onDelete, onSelect, onLoadMore, hasMore }) {
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({ favorites: true });
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isRenameChatModalOpen, setIsRenameChatModalOpen] = useState(false);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState(null);
  const [deleteChatTarget, setDeleteChatTarget] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // Data Hooks
  const { data: groups = [] } = useTitanosGroups();
  const { save: saveGroupMutation, remove: deleteGroupMutation } = useGroupMutations();
  const { updateChat: updateChatMutation, renameChat: renameChatMutation } = useChatMutations();

  // Helpers
  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  // Memoized data
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(c => c.title?.toLowerCase().includes(query));
  }, [conversations, searchQuery]);

  const favoriteChats = useMemo(
    () => filteredConversations.filter(c => c.is_favorite), 
    [filteredConversations]
  );

  const groupedConversations = useMemo(() => {
    const grouped = {};
    const ungrouped = [];
    groups.forEach(g => grouped[g.id] = []);
    filteredConversations.forEach(c => {
      if (c.group_id && grouped[c.group_id]) {
        grouped[c.group_id].push(c);
      } else {
        ungrouped.push(c);
      }
    });
    return { grouped, ungrouped };
  }, [groups, filteredConversations]);

  // Handlers
  const handleDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const chatId = draggableId.replace('chat-', '');
    
    if (destination.droppableId === 'favorites') {
      updateChatMutation.mutate({ chatId, data: { is_favorite: true } });
      toast.success('Adicionado aos favoritos!');
      return;
    }

    const newGroupId = destination.droppableId === 'ungrouped' ? null : destination.droppableId;
    updateChatMutation.mutate({ chatId, data: { group_id: newGroupId } });
    toast.success(newGroupId ? 'Chat movido para o grupo!' : 'Chat removido do grupo!');
  }, [updateChatMutation]);

  const handleToggleFavorite = useCallback((chat) => {
    updateChatMutation.mutate({ chatId: chat.id, data: { is_favorite: !chat.is_favorite } });
    toast.success(chat.is_favorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos!');
  }, [updateChatMutation]);

  const openGroupSettings = useCallback((group = null) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  }, []);

  const handleSaveGroup = useCallback((data) => {
    saveGroupMutation.mutate({ id: editingGroup?.id, data });
    setIsGroupModalOpen(false);
    setEditingGroup(null);
  }, [saveGroupMutation, editingGroup]);

  const openRenameChat = useCallback((chat) => {
    setSelectedChat(chat);
    setInputValue(chat.title);
    setIsRenameChatModalOpen(true);
  }, []);

  // Auto-expand groups
  React.useEffect(() => {
    if (groups.length > 0) {
      setExpandedGroups(prev => {
        const newState = { ...prev };
        groups.forEach(g => {
          if (newState[g.id] === undefined) newState[g.id] = true;
        });
        return newState;
      });
    }
  }, [groups]);

    const renderChatCard = (chat, index, isFavoriteSection = false) => (
        <Draggable 
            key={`${isFavoriteSection ? 'fav-' : ''}${chat.id}`} 
            draggableId={`chat-${chat.id}`} 
            index={index}
        >
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? 'opacity-80' : ''}
                >
                    <ConversationCard 
                        chat={chat} 
                        isActive={activeId === chat.id}
                        onSelect={onSelect}
                        onDelete={(c) => setDeleteChatTarget(c)}
                        groups={groups}
                        onMove={(gid) => updateChatMutation.mutate({ chatId: chat.id, data: { group_id: gid } })}
                        onRename={() => openRenameChat(chat)}
                        onToggleFavorite={() => handleToggleFavorite(chat)}
                    />
                </div>
            )}
        </Draggable>
    );

    return (
        <div className="w-[280px] h-full bg-white flex flex-col shrink-0 border-r border-slate-200">
            {/* Header */}
            <div className="p-3 pb-2 space-y-3">
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={onNew} 
                        className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-sm h-9 rounded-md text-xs font-medium transition-all"
                    >
                        <Plus className="w-3.5 h-3.5 mr-2" /> Nova Conversa
                    </Button>
                    
                    <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => openGroupSettings(null)}
                        className="h-9 w-9 shrink-0 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md"
                        title="Novo Grupo"
                    >
                        <FolderPlus className="w-4 h-4" />
                    </Button>
                </div>

                {/* Search Input */}
                <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                    <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar..."
                        className="pl-8 pr-7 h-8 rounded-md bg-slate-50/80 border-slate-200 focus:bg-white focus:border-slate-300 focus:ring-0 text-xs transition-all placeholder:text-slate-400"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
            
            <ScrollArea className="flex-1 px-2 pb-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="space-y-2">
                        
                        {/* Favorites Section */}
                        {favoriteChats.length > 0 && (
                            <div className="space-y-0.5">
                                <div className="flex items-center px-2 py-1 group/fav">
                                    <button 
                                        onClick={() => toggleGroup('favorites')}
                                        className="flex items-center flex-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                                    >
                                        <div className="mr-1.5 text-slate-400 group-hover/fav:text-slate-600">
                                            {expandedGroups['favorites'] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        </div>
                                        <span className="uppercase tracking-wider">Favoritos</span>
                                        <span className="ml-auto text-[9px] text-slate-400 bg-slate-50 px-1.5 rounded-full">
                                            {favoriteChats.length}
                                        </span>
                                    </button>
                                </div>

                                {expandedGroups['favorites'] && (
                                    <Droppable droppableId="favorites">
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`space-y-0.5 pl-2 ml-1.5 border-l border-slate-100 min-h-[10px] transition-colors ${
                                                    snapshot.isDraggingOver ? 'bg-amber-50/50 rounded-r-md' : ''
                                                }`}
                                            >
                                                {favoriteChats.map((chat, idx) => renderChatCard(chat, idx, true))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                )}
                            </div>
                        )}

                        {/* Drop zone for favorites when empty */}
                        {favoriteChats.length === 0 && (
                            <Droppable droppableId="favorites">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`px-3 py-2 rounded-lg border-2 border-dashed transition-all ${
                                            snapshot.isDraggingOver 
                                                ? 'border-amber-400 bg-amber-50' 
                                                : 'border-transparent'
                                        }`}
                                    >
                                        {snapshot.isDraggingOver && (
                                            <div className="flex items-center gap-2 text-xs text-amber-600">
                                                <Star className="w-3 h-3" />
                                                Solte para adicionar aos favoritos
                                            </div>
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        )}

                        {/* Groups */}
                        {groups.map(group => (
                            <div key={group.id} className="space-y-0.5">
                                <div className="flex items-center group/header px-2 py-1">
                                    <button 
                                        onClick={() => toggleGroup(group.id)}
                                        className="flex items-center flex-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors min-w-0"
                                    >
                                        <div className="mr-1.5 text-slate-400 group-hover/header:text-slate-600 shrink-0">
                                            {expandedGroups[group.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        </div>
                                        <span className="truncate uppercase tracking-wider">{group.title}</span>
                                        {group.default_system_prompt && (
                                            <span className="ml-1.5 shrink-0 opacity-70" title="Possui System Prompt">
                                                <ScrollText className="w-2.5 h-2.5 text-pink-500" />
                                            </span>
                                        )}
                                        <span className="ml-auto text-[9px] text-slate-400 bg-slate-50 px-1.5 rounded-full shrink-0">
                                            {groupedConversations.grouped[group.id]?.length || 0}
                                        </span>
                                    </button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="opacity-0 group-hover/header:opacity-100 p-0.5 hover:bg-slate-100 rounded text-slate-400 shrink-0">
                                                <MoreVertical className="w-3 h-3" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => onNewInGroup && onNewInGroup(group)}>
                                                <Plus className="w-3.5 h-3.5 mr-2" /> Nova Conversa no Grupo
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => openGroupSettings(group)}>
                                                <Pencil className="w-3.5 h-3.5 mr-2" /> Configurações
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                onClick={() => setDeleteGroupTarget(group)}
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir Grupo
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {expandedGroups[group.id] && (
                                    <Droppable droppableId={group.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`space-y-0.5 pl-2 ml-1.5 border-l border-slate-100 min-h-[10px] transition-colors ${
                                                    snapshot.isDraggingOver ? 'bg-pink-50/50 rounded-r-md' : ''
                                                }`}
                                            >
                                                {groupedConversations.grouped[group.id]?.map((chat, idx) => renderChatCard(chat, idx))}
                                                {groupedConversations.grouped[group.id]?.length === 0 && !snapshot.isDraggingOver && (
                                                    <div className="px-2 py-1 text-[10px] text-slate-300 italic">
                                                        Vazio
                                                    </div>
                                                )}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                )}
                            </div>
                        ))}

                        {/* Ungrouped Chats */}
                        <div className="space-y-0.5">
                            {(groups.length > 0 || favoriteChats.length > 0) && groupedConversations.ungrouped.length > 0 && (
                                 <div className="px-2 py-2 pt-4 text-[10px] font-medium text-slate-400 uppercase tracking-wider opacity-70">
                                     Outras Conversas
                                 </div>
                            )}
                            
                            <Droppable droppableId="ungrouped">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`space-y-1 min-h-[20px] transition-colors ${
                                            snapshot.isDraggingOver ? 'bg-slate-100 rounded-lg p-1' : ''
                                        }`}
                                    >
                                        {groupedConversations.ungrouped.map((chat, idx) => renderChatCard(chat, idx))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>

                            {conversations.length === 0 && (
                                 <div className="text-center py-8 px-4">
                                    <p className="text-xs text-slate-400">Nenhuma conversa iniciada.</p>
                                 </div>
                            )}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="pt-2 px-1">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={onLoadMore}
                                    className="w-full text-xs text-slate-400 hover:text-pink-600 hover:bg-pink-50 border border-transparent hover:border-pink-100 flex items-center justify-center gap-2 h-8"
                                >
                                    <ChevronDownCircle className="w-3.5 h-3.5" />
                                    Ver mais conversas
                                </Button>
                            </div>
                        )}

                    </div>
                </DragDropContext>
            </ScrollArea>

      {/* Modals */}
      <GroupSettingsModal 
        open={isGroupModalOpen}
        onOpenChange={(open) => { setIsGroupModalOpen(open); if (!open) setEditingGroup(null); }}
        group={editingGroup}
        onSave={handleSaveGroup}
        isLoading={saveGroupMutation.isPending}
      />

      <Dialog open={isRenameChatModalOpen} onOpenChange={setIsRenameChatModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Renomear Conversa</DialogTitle></DialogHeader>
          <div className="py-2">
            <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Título da conversa..." autoFocus />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRenameChatModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => { selectedChat && renameChatMutation.mutate({ id: selectedChat.id, title: inputValue }); setIsRenameChatModalOpen(false); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteGroupTarget} onOpenChange={(open) => !open && setDeleteGroupTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o grupo "{deleteGroupTarget?.title}"? As conversas serão movidas para "Outras Conversas".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteGroupTarget && deleteGroupMutation.mutate(deleteGroupTarget.id); setDeleteGroupTarget(null); }} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteChatTarget} onOpenChange={(open) => !open && setDeleteChatTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conversa "{deleteChatTarget?.title || 'Sem título'}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteChatTarget && onDelete(deleteChatTarget.id); setDeleteChatTarget(null); }} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default memo(ConversationSidebar);