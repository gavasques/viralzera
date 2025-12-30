import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, Video, FileText, Hash, Pencil, Trash2, Eye, Youtube
} from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-slate-100 text-slate-600",
  ready: "bg-green-100 text-green-700",
  used: "bg-blue-100 text-blue-700"
};

const statusLabels = {
  draft: "Rascunho",
  ready: "Pronto",
  used: "Utilizado"
};

const platformIcons = {
  "YouTube": Youtube,
  "YouTube Shorts": Youtube,
};

export default function ModelingCard({ modeling, onClick, onEdit, onDelete }) {
  const PlatformIcon = platformIcons[modeling.target_platform] || Video;

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card 
      className="hover:shadow-md transition-all cursor-pointer group border-slate-200"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-2 bg-pink-50 rounded-lg shrink-0">
              <PlatformIcon className="w-5 h-5 text-pink-600" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold text-slate-900 truncate">
                {modeling.title}
              </CardTitle>
              {modeling.description && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{modeling.description}</p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                <Eye className="w-4 h-4 mr-2" /> Abrir
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
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className={statusColors[modeling.status] || statusColors.draft}>
            {statusLabels[modeling.status] || "Rascunho"}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {modeling.target_platform || "YouTube"}
          </Badge>
          {modeling.content_type && (
            <Badge variant="outline" className="text-[10px] bg-slate-50">
              {modeling.content_type}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 py-3 border-t border-slate-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <Video className="w-3 h-3" />
            </div>
            <p className="text-lg font-bold text-slate-900">{modeling.video_count || 0}</p>
            <p className="text-[10px] text-slate-500">Vídeos</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <FileText className="w-3 h-3" />
            </div>
            <p className="text-lg font-bold text-slate-900">{modeling.text_count || 0}</p>
            <p className="text-[10px] text-slate-500">Textos</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <Hash className="w-3 h-3" />
            </div>
            <p className="text-lg font-bold text-slate-900">{formatNumber(modeling.total_tokens_estimate || 0)}</p>
            <p className="text-[10px] text-slate-500">Tokens</p>
          </div>
        </div>

        <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-50">
          Criado em {format(new Date(modeling.created_date), "dd/MM/yyyy")}
        </div>
      </CardContent>
    </Card>
  );
}