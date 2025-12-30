import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit2, Trash2, Video, FileText, Layers } from "lucide-react";

export default function ModelingCard({ modeling, onClick, onEdit, onDelete }) {
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

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-100 overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-pink-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{modeling.title}</h3>
                {modeling.target_platform && (
                  <p className="text-xs text-slate-500">{modeling.target_platform}</p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Edit2 className="w-4 h-4 mr-2" /> Editar
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
          {modeling.description && (
            <p className="text-sm text-slate-600 line-clamp-2">{modeling.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Video className="w-4 h-4" />
              <span>{modeling.video_count || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <FileText className="w-4 h-4" />
              <span>{modeling.text_count || 0}</span>
            </div>
            {modeling.total_tokens_estimate > 0 && (
              <div className="text-slate-400 text-xs">
                ~{(modeling.total_tokens_estimate / 1000).toFixed(1)}k tokens
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge className={statusColors[modeling.status || 'draft']}>
              {statusLabels[modeling.status || 'draft']}
            </Badge>
            {modeling.content_type && (
              <span className="text-xs text-slate-400">{modeling.content_type}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}