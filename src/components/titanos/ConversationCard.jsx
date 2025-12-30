import React from 'react';
import { MessageSquare, MoreVertical, Pencil, Trash2, Folder, ArrowRightLeft, Star, StarOff, Clock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function ConversationCard({ 
    chat, 
    isActive, 
    onSelect, 
    onDelete, 
    groups, 
    onMove, 
    onRename,
    onToggleFavorite
}) {
    // Count messages (excluding system messages)
    const messageCount = chat.message_count || 0;

    return (
        <div 
            className={`
                group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all
                ${isActive 
                    ? 'bg-pink-50 border border-pink-200' 
                    : 'hover:bg-slate-50 border border-transparent'}
            `}
            onClick={() => onSelect(chat.id)}
        >
            <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-pink-600' : 'text-slate-400'}`} />
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-pink-900' : 'text-slate-700'}`}>
                        {chat.title || 'Sem título'}
                    </p>
                    {chat.is_favorite && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{moment(chat.created_date).fromNow()}</span>
                    {messageCount > 0 && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            {messageCount}
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
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}>
                        {chat.is_favorite ? (
                            <><StarOff className="w-3.5 h-3.5 mr-2" /> Remover dos Favoritos</>
                        ) : (
                            <><Star className="w-3.5 h-3.5 mr-2" /> Adicionar aos Favoritos</>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                        <Pencil className="w-3.5 h-3.5 mr-2" /> Renomear
                    </DropdownMenuItem>
                    
                    {groups.length > 0 && (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Folder className="w-3.5 h-3.5 mr-2" /> Mover para...
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-40">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(null); }}>
                                    <ArrowRightLeft className="w-3.5 h-3.5 mr-2" /> (Sem Grupo)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {groups.map(g => (
                                    <DropdownMenuItem key={g.id} onClick={(e) => { e.stopPropagation(); onMove(g.id); }}>
                                        <Folder className="w-3.5 h-3.5 mr-2 text-indigo-500" /> {g.title}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDelete(chat); }} 
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}