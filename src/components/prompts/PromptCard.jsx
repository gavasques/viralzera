import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bot, MessageCircle, MoreVertical, Pencil, Trash2, Copy, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function PromptCard({ prompt, onEdit, onDelete }) {
  const isSystem = prompt.type === 'system_prompt';

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.content);
    toast.success('Prompt copiado!');
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-100 overflow-hidden"
      onClick={onEdit}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className={`p-4 border-b border-slate-100 ${isSystem ? 'bg-violet-50/50' : 'bg-emerald-50/50'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isSystem ? 'bg-violet-100' : 'bg-emerald-100'
              }`}>
                {isSystem ? (
                  <Bot className="w-4 h-4 text-violet-600" />
                ) : (
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 truncate text-sm">{prompt.title}</h3>
                <Badge variant="outline" className="text-xs mt-1">
                  {isSystem ? 'Sistema' : 'Usuário'}
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-2" /> Copiar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {prompt.description && (
            <p className="text-sm text-slate-500 line-clamp-1">{prompt.description}</p>
          )}
          
          <p className="text-sm text-slate-600 line-clamp-3 font-mono bg-slate-50 p-2 rounded-lg">
            {prompt.content}
          </p>

          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {prompt.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {prompt.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                  +{prompt.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Category */}
          {prompt.category && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">{prompt.category}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}