import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, Wand2, Send, Clock, Bot } from 'lucide-react';

/**
 * Modal para exibir logs do refinador de prompt (apenas para admin)
 */
export default function RefinerLogModal({ open, onOpenChange, log }) {
    if (!log) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-600" />
                        Log do Refinador de Prompt
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[70vh]">
                    <div className="p-6 space-y-6">
                        {/* Timestamp e Modelo */}
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : 'N/A'}</span>
                            </div>
                            {log.refiner_model && (
                                <div className="flex items-center gap-2">
                                    <Bot className="w-4 h-4" />
                                    <span>{log.refiner_model}</span>
                                </div>
                            )}
                        </div>

                        {/* Prompt Original */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-slate-800">1. Prompt Original (Enviado ao Refinador)</span>
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    Input
                                </Badge>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                                    {log.raw_prompt || 'N/A'}
                                </pre>
                            </div>
                        </div>

                        {/* Prompt Refinado */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-purple-600" />
                                <span className="font-semibold text-slate-800">2. Prompt Refinado (Retorno do Refinador)</span>
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                    Output
                                </Badge>
                            </div>
                            <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                                    {log.refined_prompt || log.raw_prompt || 'N/A'}
                                </pre>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <Send className="w-4 h-4 text-amber-600" />
                            <span className="text-sm text-amber-800">
                                O prompt refinado acima foi enviado para os modelos de IA selecionados.
                            </span>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}