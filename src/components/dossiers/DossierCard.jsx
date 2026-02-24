import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { FileText, MoreVertical, Eye, Trash2, Hash, Sparkles, Layers, Calendar, Power } from "lucide-react";
import { format } from "date-fns";

export default function DossierCard({ dossier, onView, onDelete, onUseForScript, onToggleActive }) {
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const isActive = dossier.is_active !== false; // default true

  return (
    <Card
      className={`hover:shadow-md transition-all cursor-pointer group border-slate-200 hover:border-purple-200 ${!isActive ? 'opacity-60' : ''}`}
      onClick={onView}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="p-2 bg-purple-50 rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>

          {/* Title & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {dossier.modeling?.title || 'Dossiê'}
              </h3>
              {!isActive && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-amber-600 border-amber-300">
                  Inativo
                </Badge>
              )}
            </div>
            {dossier.modeling?.description && (
              <p className="text-xs text-slate-500 line-clamp-1 mb-1">{dossier.modeling.description}</p>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              {dossier.modeling?.target_platform && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {dossier.modeling.target_platform}
                </Badge>
              )}
              {dossier.modeling?.content_type && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-slate-50">
                  {dossier.modeling.content_type}
                </Badge>
              )}
              <span className="text-[10px] text-slate-400">
                • {dossier.created_at ? format(new Date(dossier.created_at), 'dd/MM/yyyy') : '—'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-purple-500" />
              <div>
                <p className="text-sm font-bold text-slate-900">{formatNumber(dossier.character_count)}</p>
                <p className="text-[9px] text-slate-400 leading-none">chars</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <div>
                <p className="text-sm font-bold text-slate-900">~{formatNumber(dossier.token_estimate)}</p>
                <p className="text-[9px] text-slate-400 leading-none">tokens</p>
              </div>
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
              <DropdownMenuItem onClick={onView}>
                <Eye className="w-4 h-4 mr-2" /> Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUseForScript}>
                <Sparkles className="w-4 h-4 mr-2" /> Usar para Roteiro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                <Power className="w-4 h-4 mr-2" /> {isActive ? 'Inativar' : 'Ativar'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}