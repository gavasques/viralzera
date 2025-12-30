import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, Music, Youtube, FileText, Loader2, 
  Play, CheckCircle, AlertCircle, Trash2, Eye,
  FileAudio, FileSearch, Quote, RefreshCw, Sparkles
} from "lucide-react";

const typeIcons = {
  video: Video,
  audio: FileAudio,
  youtube: Youtube,
  text: FileText
};

const typeColors = {
  video: 'bg-blue-100 text-blue-700',
  audio: 'bg-purple-100 text-purple-700',
  youtube: 'bg-red-100 text-red-700',
  text: 'bg-green-100 text-green-700'
};

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-slate-100 text-slate-600', icon: null },
  transcribing: { label: 'Transcrevendo...', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  transcribed: { label: 'Transcrito', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  analyzing: { label: 'Analisando...', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  analyzed: { label: 'Analisado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  error: { label: 'Erro', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

export default function DNAContentCard({ content, isProcessing, onTranscribe, onAnalyze, onReanalyze, onDelete }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const TypeIcon = typeIcons[content.type] || FileText;
  const status = statusConfig[content.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const canTranscribe = content.status === 'pending' && content.type !== 'text';
  const canAnalyze = content.status === 'transcribed' || (content.status === 'pending' && content.type === 'text');
  const isAnalyzed = content.status === 'analyzed';
  const hasTranscript = !!content.transcript;
  const hasAnalysis = !!content.analysis;

  return (
    <Card className="group hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${typeColors[content.type]}`}>
            <TypeIcon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900 truncate">{content.title}</h3>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${status.color}`}>
                {StatusIcon && (
                  <StatusIcon className={`w-3 h-3 mr-1 ${status.icon === Loader2 ? 'animate-spin' : ''}`} />
                )}
                {status.label}
              </Badge>
            </div>

            {content.url && (
              <p className="text-xs text-slate-400 truncate mt-1">{content.url}</p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {canTranscribe && (
            <Button
              size="sm"
              variant="outline"
              onClick={onTranscribe}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              Transcrever
            </Button>
          )}
          
          {canAnalyze && (
            <Button
              size="sm"
              onClick={onAnalyze}
              disabled={isProcessing}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-1" />
              )}
              Analisar
            </Button>
          )}

          {isAnalyzed && (
            <>
              <Badge className="bg-green-100 text-green-700 flex-1 justify-center py-2">
                <CheckCircle className="w-4 h-4 mr-1" />
                Pronto para DNA
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={onReanalyze}
                disabled={isProcessing}
                className="text-indigo-600 hover:text-indigo-700"
                title="Reanalisar"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </>
          )}

          {(hasTranscript || hasAnalysis) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(true)}
              className="w-full mt-2 text-slate-600"
            >
              <FileSearch className="w-4 h-4 mr-1" />
              Ver Detalhes
            </Button>
          )}
        </div>
      </CardContent>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white shadow-2xl border-0">
          <div className="px-6 py-5 border-b bg-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
             <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${typeColors[content.type]} bg-opacity-20`}>
                  <TypeIcon className="w-5 h-5" />
                </div>
                <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">
                  {content.title}
                </DialogTitle>
             </div>
          </div>

          <Tabs defaultValue={hasTranscript ? "transcript" : "analysis"} className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
            <div className="px-6 pt-6 pb-2">
              <TabsList className="bg-slate-100/80 p-1 rounded-xl w-fit border border-slate-200">
                {hasTranscript && (
                  <TabsTrigger 
                    value="transcript" 
                    className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex items-center gap-2"
                  >
                    <Quote className="w-4 h-4" />
                    Transcrição
                  </TabsTrigger>
                )}
                {hasAnalysis && (
                  <TabsTrigger 
                    value="analysis" 
                    className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex items-center gap-2"
                  >
                    <FileSearch className="w-4 h-4" />
                    Análise de DNA
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {hasTranscript && (
                <TabsContent value="transcript" className="mt-0 h-full focus-visible:ring-0">
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 min-h-full">
                    <pre className="whitespace-pre-wrap text-sm text-slate-600 font-mono leading-relaxed">
                      {content.transcript}
                    </pre>
                  </div>
                </TabsContent>
              )}

              {hasAnalysis && (
                <TabsContent value="analysis" className="mt-0 focus-visible:ring-0 space-y-6">
                  
                  {/* Bordões e Frases */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.analysis.bordoes?.length > 0 && (
                      <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                        <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-50">
                          <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                            <Quote className="w-4 h-4" /> Bordões Recorrentes
                          </h4>
                        </div>
                        <div className="p-4 space-y-3">
                          {content.analysis.bordoes.map((item, i) => (
                            <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <p className="font-medium text-slate-900 text-sm">"{item.texto}"</p>
                              {item.trecho && (
                                <p className="text-slate-500 text-xs mt-1 italic pl-2 border-l-2 border-slate-200">
                                  Contexto: {item.trecho}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {content.analysis.frases_de_efeito?.length > 0 && (
                      <div className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
                        <div className="bg-amber-50/50 px-4 py-3 border-b border-amber-50">
                          <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Frases de Efeito
                          </h4>
                        </div>
                        <div className="p-4 space-y-3">
                          {content.analysis.frases_de_efeito.map((item, i) => (
                            <div key={i} className="flex items-start justify-between gap-2 p-2 rounded hover:bg-slate-50">
                              <span className="font-medium text-slate-800 text-sm">"{item.texto}"</span>
                              <Badge variant="outline" className="text-[10px] bg-white whitespace-nowrap">{item.categoria}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Palavras e Expressões - Full Width */}
                  {content.analysis.palavras_e_expressoes?.length > 0 && (
                    <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
                      <div className="bg-green-50/50 px-4 py-3 border-b border-green-50">
                        <h4 className="font-semibold text-green-900 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Vocabulário e Expressões
                        </h4>
                      </div>
                      <div className="p-4 flex flex-wrap gap-2">
                        {content.analysis.palavras_e_expressoes.map((item, i) => (
                          <div key={i} className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 px-3 py-1.5 rounded-full border border-green-100 text-sm font-medium">
                            {item.texto}
                            <span className="text-[10px] opacity-60 uppercase tracking-wide border-l border-green-200 pl-1.5 ml-0.5">
                              {item.funcao}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Three Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* CTAs */}
                    <div className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden h-full">
                      <div className="bg-purple-50/50 px-4 py-3 border-b border-purple-50">
                        <h4 className="font-semibold text-purple-900 text-sm uppercase tracking-wide">Chamadas para Ação</h4>
                      </div>
                      <div className="p-4 space-y-3">
                        {content.analysis.ctas?.map((item, i) => (
                          <div key={i} className="text-sm border-l-2 border-purple-200 pl-3 py-1">
                            <p className="font-medium text-slate-900">{item.cta}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.estilo}</p>
                          </div>
                        ))}
                        {(!content.analysis.ctas || content.analysis.ctas.length === 0) && (
                          <p className="text-xs text-slate-400 italic">Nenhum CTA identificado.</p>
                        )}
                      </div>
                    </div>

                    {/* Crenças */}
                    <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden h-full">
                      <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-50">
                        <h4 className="font-semibold text-blue-900 text-sm uppercase tracking-wide">Crenças e Valores</h4>
                      </div>
                      <div className="p-4 space-y-3">
                        {content.analysis.crencas?.map((item, i) => (
                          <div key={i} className="text-sm border-l-2 border-blue-200 pl-3 py-1">
                            <p className="font-medium text-slate-900">{item.crenca}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.observado_ou_inferido}</p>
                          </div>
                        ))}
                         {(!content.analysis.crencas || content.analysis.crencas.length === 0) && (
                          <p className="text-xs text-slate-400 italic">Nenhuma crença identificada.</p>
                        )}
                      </div>
                    </div>

                    {/* Anti-Heróis */}
                    <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden h-full">
                      <div className="bg-red-50/50 px-4 py-3 border-b border-red-50">
                        <h4 className="font-semibold text-red-900 text-sm uppercase tracking-wide">O que combate (Anti-Heróis)</h4>
                      </div>
                      <div className="p-4 space-y-3">
                        {content.analysis.anti_herois?.map((item, i) => (
                          <div key={i} className="text-sm border-l-2 border-red-200 pl-3 py-1">
                            <p className="font-medium text-slate-900">{item.alvo}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Tom: {item.tom}</p>
                          </div>
                        ))}
                         {(!content.analysis.anti_herois || content.analysis.anti_herois.length === 0) && (
                          <p className="text-xs text-slate-400 italic">Nenhum anti-herói identificado.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* JSON Toggle */}
                  <div className="pt-4 border-t border-slate-100">
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors list-none flex items-center gap-2">
                        <div className="w-full h-px bg-slate-100 group-open:bg-indigo-50 transition-colors"></div>
                        <span className="whitespace-nowrap">Dados Técnicos (JSON)</span>
                        <div className="w-full h-px bg-slate-100 group-open:bg-indigo-50 transition-colors"></div>
                      </summary>
                      <div className="mt-4 bg-slate-900 rounded-xl p-4 shadow-inner">
                        <pre className="text-[10px] text-slate-300 font-mono overflow-auto max-h-60 custom-scrollbar">
                          {JSON.stringify(content.analysis, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>

                </TabsContent>
              )}
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Card>
  );
}