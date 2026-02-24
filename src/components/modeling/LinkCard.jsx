import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, Loader2, CheckCircle2, AlertCircle, Hash, FileText, Trash2, Eye, ExternalLink, Download, Edit, Sparkles, RefreshCw, Clock, ChevronDown
} from "lucide-react";

const scrapeStatusConfig = {
  pending: { label: "Pendente", color: "bg-slate-100 text-slate-600", icon: Clock },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-600", icon: Loader2 },
  completed: { label: "Dados OK", color: "bg-green-100 text-green-600", icon: CheckCircle2 },
  error: { label: "Erro", color: "bg-red-100 text-red-600", icon: AlertCircle }
};

const analysisStatusConfig = {
  pending: { label: "Não analisado", color: "bg-slate-100 text-slate-600", icon: Clock },
  processing: { label: "Analisando", color: "bg-purple-100 text-purple-600", icon: Loader2 },
  completed: { label: "Analisado", color: "bg-emerald-100 text-emerald-600", icon: Sparkles },
  error: { label: "Erro", color: "bg-red-100 text-red-600", icon: AlertCircle }
};

export default function LinkCard({ link, onClick, onEdit, onScrape, onAnalyze, onDelete, processing = false, analyzing = false }) {
  const [showContent, setShowContent] = useState(false);
  const ScrapeStatusIcon = scrapeStatusConfig[link.scrape_status]?.icon || Clock;
  const AnalysisStatusIcon = analysisStatusConfig[link.analysis_status]?.icon || Clock;

  const handleScrapeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Botão Capturar Dados clicado!', link.id);
    onScrape();
  };

  const handleAnalyzeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Botão Analisar clicado!', link.id);
    onAnalyze();
  };

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
                  
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" /> Editar
                  </DropdownMenuItem>

                  {link.scrape_status === 'completed' && link.content && (
                    <DropdownMenuItem onClick={() => setShowContent(!showContent)}>
                      <Eye className="w-4 h-4 mr-2" /> {showContent ? 'Ocultar' : 'Ver'} Conteúdo
                    </DropdownMenuItem>
                  )}

                  {link.analysis_status === 'completed' && (
                    <DropdownMenuItem onClick={onClick}>
                      <Sparkles className="w-4 h-4 mr-2" /> Ver Análise
                    </DropdownMenuItem>
                  )}

                  {link.scrape_status === 'completed' && (
                    <DropdownMenuItem onClick={onScrape}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Reprocessar Dados
                    </DropdownMenuItem>
                  )}

                  {link.analysis_status === 'completed' && (
                    <DropdownMenuItem onClick={onAnalyze}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Reanalisar
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge 
                variant="outline" 
                className={`text-[10px] h-5 px-2 border-0 ${scrapeStatusConfig[link.scrape_status]?.color || scrapeStatusConfig.pending.color}`}
              >
                <ScrapeStatusIcon className={`w-3 h-3 mr-1 ${link.scrape_status === 'processing' ? 'animate-spin' : ''}`} />
                {scrapeStatusConfig[link.scrape_status]?.label || "Pendente"}
              </Badge>
              
              {link.scrape_status === 'completed' && (
                <Badge 
                  variant="outline" 
                  className={`text-[10px] h-5 px-2 border-0 ${analysisStatusConfig[link.analysis_status]?.color || analysisStatusConfig.pending.color}`}
                >
                  <AnalysisStatusIcon className={`w-3 h-3 mr-1 ${link.analysis_status === 'processing' ? 'animate-spin' : ''}`} />
                  {analysisStatusConfig[link.analysis_status]?.label || "Pendente"}
                </Badge>
              )}
            </div>
              
            {link.scrape_status === 'completed' && link.character_count > 0 && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="outline" className="text-[10px]">
                  <FileText className="w-3 h-3 mr-1" />
                  {formatNumber(link.character_count)} chars
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Hash className="w-3 h-3 mr-1" />
                  ~{formatNumber(link.token_estimate)} tokens
                </Badge>
              </div>
            )}

            {link.scrape_status === 'completed' && link.content && showContent && (
              <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {link.content}
              </div>
            )}

            {link.scrape_status === 'error' && link.scrape_error_message && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mt-2">
                <span className="font-medium">Erro no scraping:</span> {link.scrape_error_message}
              </div>
            )}

            {link.analysis_status === 'error' && link.analysis_error_message && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mt-2">
                <span className="font-medium">Erro na análise:</span> {link.analysis_error_message}
              </div>
            )}

            {link.notes && (
              <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic border-l-2 border-slate-200 pl-2">{link.notes}</p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {link.scrape_status === 'pending' && (
                <Button 
                  size="sm" 
                  className="h-8 text-xs bg-sky-600 hover:bg-sky-700 shadow-sm"
                  onClick={handleScrapeClick}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Capturando...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Capturar Dados
                    </>
                  )}
                </Button>
              )}

              {link.scrape_status === 'completed' && link.analysis_status === 'pending' && (
                <Button 
                  size="sm" 
                  className="h-8 text-xs bg-purple-600 hover:bg-purple-700 shadow-sm"
                  onClick={handleAnalyzeClick}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Analisar Conteúdo
                    </>
                  )}
                </Button>
              )}
              
              {link.analysis_status === 'completed' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Ver Análise
                </Button>
              )}

              {link.scrape_status === 'error' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onScrape();
                  }}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Tentando novamente...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Tentar novamente
                    </>
                  )}
                </Button>
              )}

              {link.analysis_status === 'error' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnalyze();
                  }}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Tentando novamente...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reanalisar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}