import React from 'react';
import { Bot, MessageCircle, Pencil, Trash2, MoreVertical, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export default function PromptCard({ prompt, onEdit, onDelete, onClick }) {
    const isSystem = prompt.type === 'system_prompt';

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt.content);
        toast.success('Prompt copiado!');
    };

    return (
        <div 
            className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow group cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSystem ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isSystem ? <Bot className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                    </div>
                    <Badge variant="outline" className={isSystem ? 'border-purple-200 text-purple-700 bg-purple-50' : 'border-blue-200 text-blue-700 bg-blue-50'}>
                        {isSystem ? 'Sistema' : 'Usuário'}
                    </Badge>
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleCopy}>
                            <Copy className="w-3.5 h-3.5 mr-2" /> Copiar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">{prompt.title}</h3>
            
            {prompt.description && (
                <p className="text-xs text-slate-500 mb-2 line-clamp-1">{prompt.description}</p>
            )}

            <p className="text-sm text-slate-600 line-clamp-3 bg-slate-50 p-2 rounded-lg font-mono text-xs mb-3">
                {prompt.content}
            </p>

            {(prompt.category || (prompt.tags && prompt.tags.length > 0)) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2 border-t border-slate-100">
                    {prompt.category && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            {prompt.category}
                        </span>
                    )}
                    {prompt.tags && prompt.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}