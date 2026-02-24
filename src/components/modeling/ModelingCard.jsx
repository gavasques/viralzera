import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, Video, FileText, Hash, Pencil, Trash2, Eye, Youtube, Link2
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
      className="hover:shadow-md transition-all cursor-pointer group border-slate-200 hover:border-pink-200"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="p-2 bg-pink-50 rounded-lg shrink-0">
            <PlatformIcon className="w-5 h-5 text-pink-600" />
          </div>
          
          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 mb-0.5 truncate">
              {modeling.title}
            </h3>
            {modeling.description && (
              <p className="text-xs text-slate-500 line-clamp-1 mb-1">{modeling.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {modeling.target_platform || "YouTube"}
              </Badge>
              {modeling.content_type && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-slate-50">
                  {modeling.content_type}
                </Badge>
              )}
              <span className="text-[10px] text-slate-400">
                {format(new Date(modeling.created_at), "dd/MM/yyyy")}
              </span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5 text-red-500 mb-0.5">
                <Video className="w-3 h-3" />
              </div>
              <p className="text-base font-bold text-slate-900">{modeling.video_count || 0}</p>
              <p className="text-[9px] text-slate-500">Vídeos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5 text-blue-500 mb-0.5">
                <FileText className="w-3 h-3" />
              </div>
              <p className="text-base font-bold text-slate-900">{modeling.text_count || 0}</p>
              <p className="text-[9px] text-slate-500">Textos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5 text-sky-500 mb-0.5">
                <Link2 className="w-3 h-3" />
              </div>
              <p className="text-base font-bold text-slate-900">{modeling.link_count || 0}</p>
              <p className="text-[9px] text-slate-500">Links</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5 text-purple-500 mb-0.5">
                <Hash className="w-3 h-3" />
              </div>
              <p className="text-base font-bold text-slate-900">{formatNumber(modeling.total_tokens_estimate || 0)}</p>
              <p className="text-[9px] text-slate-500">Tokens</p>
            </div>
          </div>
          
          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="w-3.5 h-3.5" />
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
      </CardContent>
    </Card>
  );
}