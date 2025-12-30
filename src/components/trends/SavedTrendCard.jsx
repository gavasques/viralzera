import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Calendar
} from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SavedTrendCard({ trend, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900">{trend.title}</h3>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {trend.subject && (
                <Badge variant="secondary" className="text-xs">{trend.subject}</Badge>
              )}
              {trend.keyword && (
                <Badge variant="outline" className="text-xs">{trend.keyword}</Badge>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(trend.created_date), "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {trend.source_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(trend.source_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expandable Content */}
        {trend.content && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mt-3"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {expanded ? "Ver menos" : "Ver conteúdo"}
            </button>
            
            {expanded && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {trend.content}
              </div>
            )}
          </>
        )}

        {/* Source */}
        {trend.source_title && (
          <p className="text-xs text-slate-400 mt-2">
            Fonte: {trend.source_title}
          </p>
        )}
      </CardContent>
    </Card>
  );
}