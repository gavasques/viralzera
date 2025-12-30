import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, FileText, Hash, Pencil, Trash2, Eye
} from "lucide-react";

const typeLabels = {
  script: 'Script',
  reference: 'Referência',
  notes: 'Notas',
  research: 'Pesquisa',
  outline: 'Estrutura',
  other: 'Outro'
};

const typeColors = {
  script: 'bg-purple-100 text-purple-700',
  reference: 'bg-blue-100 text-blue-700',
  notes: 'bg-amber-100 text-amber-700',
  research: 'bg-green-100 text-green-700',
  outline: 'bg-pink-100 text-pink-700',
  other: 'bg-slate-100 text-slate-700'
};

export default function TextCard({ text, onView, onEdit, onDelete }) {
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  return (
    <Card className="hover:shadow-md transition-all group cursor-pointer" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="p-2 bg-blue-50 rounded-lg shrink-0">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-slate-900 truncate text-sm">
                {text.title}
              </h3>
              {text.description && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{text.description}</p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(); }}>
                <Eye className="w-4 h-4 mr-2" /> Ver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                <Pencil className="w-4 h-4 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge className={`${typeColors[text.text_type] || typeColors.other} text-[10px]`}>
            {typeLabels[text.text_type] || 'Outro'}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {formatNumber(text.character_count)} chars
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            <Hash className="w-3 h-3 mr-1" />
            ~{formatNumber(text.token_estimate)} tokens
          </Badge>
        </div>

        {text.content && (
          <p className="text-xs text-slate-500 mt-3 line-clamp-2 bg-slate-50 p-2 rounded">
            {text.content.substring(0, 150)}...
          </p>
        )}
      </CardContent>
    </Card>
  );
}