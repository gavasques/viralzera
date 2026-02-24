import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  MoreVertical, Play, Loader2, CheckCircle, AlertCircle, Hash, FileText, Trash2, Eye, ExternalLink, Sparkles, RefreshCw, StopCircle, Edit
} from "lucide-react";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-slate-100 text-slate-600", icon: null },
  transcribing: { label: "Transcrevendo...", color: "bg-amber-100 text-amber-700", icon: Loader2 },
  transcribed: { label: "Transcrito", color: "bg-green-100 text-green-700", icon: CheckCircle },
  error: { label: "Erro", color: "bg-red-100 text-red-700", icon: AlertCircle }
};

export default function VideoCard({
  video,
  analysis,
  onTranscribe,
  onAnalyze,
  onView,
  onDelete,
  onStopTranscription,
  onRetranscribe,
  onEdit,
  isTranscribing,
  isAnalyzing
}) {
  const [showAnalysis, setShowAnalysis] = React.useState(false);
  const status = statusConfig[video.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  return (
    <Card className="hover:shadow-md transition-all group">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="relative shrink-0">
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-32 h-20 object-cover rounded-lg bg-slate-100"
              />
            ) : (
              <div className="w-32 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                <Play className="w-8 h-8 text-slate-300" />
              </div>
            )}
            {video.duration && (
              <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                {video.duration}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-slate-900 truncate text-sm">
                  {video.title || 'Vídeo sem título'}
                </h3>
                {video.channel_name && (
                  <p className="text-xs text-slate-500 truncate">{video.channel_name}</p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.open(video.url, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" /> Abrir no YouTube
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" /> Editar
                  </DropdownMenuItem>

                  {video.content && (
                    <DropdownMenuItem onClick={onView}>
                      <Eye className="w-4 h-4 mr-2" /> Ver Transcrição
                    </DropdownMenuItem>
                  )}

                  {video.status === 'transcribed' && (
                    <>
                      <DropdownMenuItem onClick={onRetranscribe}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Retranscrever
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onAnalyze} disabled={isAnalyzing}>
                        <Sparkles className="w-4 h-4 mr-2" /> {isAnalyzing ? 'Reanalisando...' : 'Reanalisar Vídeo'}
                      </DropdownMenuItem>
                    </>
                  )}

                  {video.status === 'transcribing' && (
                    <DropdownMenuItem onClick={onStopTranscription} className="text-amber-600">
                      <StopCircle className="w-4 h-4 mr-2" /> Interromper Transcrição
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
                {StatusIcon && <StatusIcon className={`w-3 h-3 mr-1 ${video.status === 'transcribing' ? 'animate-spin' : ''}`} />}
                {status.label}
              </Badge>

              {analysis?.status === 'completed' && (
                <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Analisado
                </Badge>
              )}

              {video.status === 'transcribed' && (
                <>
                  <Badge variant="outline" className="text-[10px]">
                    <FileText className="w-3 h-3 mr-1" />
                    {formatNumber(video.character_count)} chars
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    <Hash className="w-3 h-3 mr-1" />
                    ~{formatNumber(video.token_estimate)} tokens
                  </Badge>
                </>
              )}
            </div>

            {analysis?.status === 'completed' && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-600 border-purple-200">
                  <FileText className="w-3 h-3 mr-1" />
                  {formatNumber(analysis.character_count)} chars
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-600 border-purple-200">
                  <Hash className="w-3 h-3 mr-1" />
                  ~{formatNumber(analysis.token_estimate)} tokens
                </Badge>
              </div>
            )}

            {video.status === 'error' && video.error_message && (
              <p className="text-xs text-red-600 mt-2 truncate">{video.error_message}</p>
            )}

            {video.notes && (
              <p className="text-xs text-slate-500 mt-2 line-clamp-1">{video.notes}</p>
            )}

            {/* Analysis Summary */}
            {analysis?.status === 'completed' && (
              <div className="mt-3 border-t pt-3">
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {showAnalysis ? 'Ocultar' : 'Ver'} Análise
                </button>
                {showAnalysis && (
                  <div className="mt-2 p-3 bg-purple-50 rounded-lg text-xs text-slate-700 max-h-40 overflow-y-auto">
                    {analysis.analysis_summary}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              {video.status === 'pending' && (
                <Button
                  size="sm"
                  className="h-7 text-xs bg-pink-600 hover:bg-pink-700"
                  onClick={onTranscribe}
                  disabled={isTranscribing}
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Transcrevendo...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Transcrever
                    </>
                  )}
                </Button>
              )}

              {video.status === 'transcribed' && (!analysis || analysis.status !== 'completed') && (
                <Button
                  size="sm"
                  className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                  onClick={onAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Analisar
                    </>
                  )}
                </Button>
              )}

              {video.status === 'error' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={onTranscribe}
                  disabled={isTranscribing}
                >
                  Tentar novamente
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}