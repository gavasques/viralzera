import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, Loader2, CheckCircle, AlertCircle, Hash, FileText, Trash2, Eye, ExternalLink, Play
} from "lucide-react";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-slate-100 text-slate-600", icon: null },
  processing: { label: "Processando...", color: "bg-amber-100 text-amber-700", icon: Loader2 },
  completed: { label: "Concluído", color: "bg-green-100 text-green-700", icon: CheckCircle },
  error: { label: "Erro", color: "bg-red-100 text-red-700", icon: AlertCircle }
};

export default function LinkCard({ link, onProcess, onView, onDelete, isProcessing }) {
  const status = statusConfig[link.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <Card className="hover:shadow-md transition-all group">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Icon */}
          <div className="shrink-0">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-sky-600" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-slate-900 truncate text-sm">
                  {link.title || getDomain(link.url)}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">{link.url}</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.open(link.url, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" /> Abrir Link
                  </DropdownMenuItem>
                  {link.summary && (
                    <DropdownMenuItem onClick={onView}>
                      <Eye className="w-4 h-4 mr-2" /> Ver Resumo
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={`${status.color} text-[10px]`}>
                {StatusIcon && <StatusIcon className={`w-3 h-3 mr-1 ${link.status === 'processing' ? 'animate-spin' : ''}`} />}
                {status.label}
              </Badge>
              
              {link.status === 'completed' && (
                <>
                  <Badge variant="outline" className="text-[10px]">
                    <FileText className="w-3 h-3 mr-1" />
                    {formatNumber(link.character_count)} chars
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    <Hash className="w-3 h-3 mr-1" />
                    ~{formatNumber(link.token_estimate)} tokens
                  </Badge>
                </>
              )}
            </div>

            {link.status === 'error' && link.error_message && (
              <p className="text-xs text-red-600 mt-2 truncate">{link.error_message}</p>
            )}

            {link.notes && (
              <p className="text-xs text-slate-500 mt-2 line-clamp-1">{link.notes}</p>
            )}

            {/* Action Button */}
            {link.status === 'pending' && (
              <Button 
                size="sm" 
                className="mt-3 h-7 text-xs bg-sky-600 hover:bg-sky-700"
                onClick={onProcess}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1" />
                    Processar
                  </>
                )}
              </Button>
            )}

            {link.status === 'error' && (
              <Button 
                size="sm" 
                variant="outline"
                className="mt-3 h-7 text-xs"
                onClick={onProcess}
                disabled={isProcessing}
              >
                Tentar novamente
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}