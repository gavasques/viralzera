import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, MoreVertical, Eye, Trash2, Hash, Sparkles, Layers, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function DossierCard({ dossier, onView, onDelete, onUseForScript }) {
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  return (
    <Card className="hover:shadow-lg transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                {dossier.modeling?.title || 'Dossiê'}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(dossier.created_date), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="w-4 h-4 mr-2" /> Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUseForScript}>
                <Sparkles className="w-4 h-4 mr-2" /> Usar para Roteiro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {dossier.modeling?.description && (
          <p className="text-xs text-slate-600 mb-3 line-clamp-2">
            {dossier.modeling.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap mb-3">
          {dossier.modeling?.target_platform && (
            <Badge variant="outline" className="text-[10px]">
              {dossier.modeling.target_platform}
            </Badge>
          )}
          {dossier.modeling?.content_type && (
            <Badge variant="outline" className="text-[10px] bg-slate-50">
              {dossier.modeling.content_type}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            <Hash className="w-3 h-3 inline mr-1" />
            {formatNumber(dossier.character_count)} chars
          </div>
          <div className="text-xs text-slate-500">
            <Layers className="w-3 h-3 inline mr-1" />
            ~{formatNumber(dossier.token_estimate)} tokens
          </div>
        </div>

        <Button 
          size="sm" 
          className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          onClick={onView}
        >
          <Eye className="w-3 h-3 mr-1" />
          Visualizar Dossiê
        </Button>
      </CardContent>
    </Card>
  );
}