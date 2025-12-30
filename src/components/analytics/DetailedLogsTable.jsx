import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

const FEATURE_LABELS = {
  audience_chat: 'Chat Público',
  persona_chat: 'Chat Persona',
  product_chat: 'Chat Produto',
  script_chat: 'Scripts',
  trends_search: 'Tendências',
  dna_transcribe: 'DNA Transcrição',
  dna_analyze: 'DNA Análise',
  dna_generate: 'DNA Geração',
  titanos_chat: 'Multi Chat',
  pdf_import: 'PDF Import',
  openrouter_chat: 'OpenRouter',
  refine_prompt: 'Refinar Prompt',
  ocr_post_type: 'OCR',
  video_transcription: 'Vídeo',
  image_generation: 'Imagem',
  other: 'Outros'
};

export default function DetailedLogsTable({ logs }) {
  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="bg-gradient-to-br from-slate-500 to-slate-600 p-2 rounded-lg">
            <FileText className="w-4 h-4 text-white" />
          </div>
          Logs Detalhados
        </CardTitle>
        <CardDescription>Últimas {logs.length} chamadas registradas</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="min-w-[800px]">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuário</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Feature</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Modelo</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tokens</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Duração</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.slice(0, 200).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600">
                        {format(parseISO(log.created_date), 'dd/MM HH:mm')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-slate-900">
                        {log.user_email?.split('@')[0]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700">
                        {FEATURE_LABELS[log.feature] || log.feature}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">
                        {log.model?.split('/').pop()?.slice(0, 20)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-semibold text-slate-900">
                        {(log.total_tokens || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-slate-500">
                        {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        {log.success !== false ? (
                          <div className="bg-emerald-100 p-1.5 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="bg-red-100 p-1.5 rounded-full" title={log.error_message}>
                            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}