import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ArrowRight, Wand2, Send, FileInput } from 'lucide-react';

/**
 * Modal para exibir logs do processo de refinamento de prompt (Admin only)
 */
export default function PromptLogModal({ open, onOpenChange, logData }) {
    const [copiedSection, setCopiedSection] = React.useState(null);

    if (!logData) return null;

    const handleCopy = (text, section) => {
        navigator.clipboard.writeText(text);
        setCopiedSection(section);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const sections = [
        {
            id: 'input',
            title: 'Dados Coletados (Input)',
            icon: FileInput,
            content: logData.rawPrompt,
            color: 'bg-blue-50 border-blue-200 text-blue-700',
            iconColor: 'text-blue-600',
        },
        {
            id: 'webhook_sent',
            title: 'Dados Enviados ao Webhook',
            icon: Send,
            content: logData.webhookPayload ? JSON.stringify(logData.webhookPayload, null, 2) : null,
            color: 'bg-amber-50 border-amber-200 text-amber-700',
            iconColor: 'text-amber-600',
            hidden: !logData.webhookPayload,
            isJson: true,
        },
        {
            id: 'webhook_response',
            title: 'Resposta do Webhook',
            icon: Wand2,
            content: logData.webhookResponse ? (typeof logData.webhookResponse === 'string' ? logData.webhookResponse : JSON.stringify(logData.webhookResponse, null, 2)) : null,
            color: 'bg-orange-50 border-orange-200 text-orange-700',
            iconColor: 'text-orange-600',
            hidden: !logData.webhookResponse,
            isJson: typeof logData.webhookResponse === 'object',
        },
        {
            id: 'refiner',
            title: 'Resposta do Refinador (IA Interna)',
            icon: Wand2,
            content: logData.refinedPrompt,
            color: 'bg-purple-50 border-purple-200 text-purple-700',
            iconColor: 'text-purple-600',
            hidden: !logData.refinedPrompt || logData.refinedPrompt === logData.rawPrompt || logData.webhookResponse,
        },
        {
            id: 'final',
            title: 'Prompt Enviado às IAs',
            icon: Send,
            content: logData.finalPrompt || logData.refinedPrompt || logData.rawPrompt,
            color: 'bg-green-50 border-green-200 text-green-700',
            iconColor: 'text-green-600',
        },
    ].filter(s => !s.hidden);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="bg-slate-900 p-1.5 rounded">
                            <Wand2 className="w-4 h-4 text-white" />
                        </div>
                        Log de Geração do Prompt
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">
                        Fluxo completo do processamento do prompt
                    </p>
                </DialogHeader>

                <ScrollArea className="max-h-[65vh] p-6 pt-4">
                    <div className="space-y-6">
                        {/* Flow indicator */}
                        <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400 flex-wrap">
                            <Badge variant="outline" className="bg-blue-50">Input</Badge>
                            <ArrowRight className="w-3 h-3" />
                            {logData.webhookPayload && (
                                <>
                                    <Badge variant="outline" className="bg-amber-50">Webhook</Badge>
                                    <ArrowRight className="w-3 h-3" />
                                </>
                            )}
                            {!logData.webhookResponse && logData.refinedPrompt && (
                                <>
                                    <Badge variant="outline" className="bg-purple-50">Refinador IA</Badge>
                                    <ArrowRight className="w-3 h-3" />
                                </>
                            )}
                            <Badge variant="outline" className="bg-green-50">IAs</Badge>
                        </div>

                        {sections.map((section, idx) => (
                            <div key={section.id} className="relative">
                                {/* Connector line */}
                                {idx < sections.length - 1 && (
                                    <div className="absolute left-6 top-full h-6 w-0.5 bg-slate-200 z-0" />
                                )}

                                <div className={`border rounded-xl p-4 ${section.color}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg bg-white/80 ${section.iconColor}`}>
                                                <section.icon className="w-4 h-4" />
                                            </div>
                                            <h3 className="font-semibold text-sm">{section.title}</h3>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(section.content, section.id)}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                copiedSection === section.id 
                                                    ? 'bg-green-100 text-green-600' 
                                                    : 'bg-white/60 hover:bg-white text-slate-500 hover:text-slate-700'
                                            }`}
                                            title="Copiar"
                                        >
                                            {copiedSection === section.id ? (
                                                <Check className="w-3.5 h-3.5" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="bg-white/70 rounded-lg p-3 max-h-64 overflow-y-auto">
                                        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                                            {section.content || 'Não disponível'}
                                        </pre>
                                    </div>
                                    {section.content && (
                                        <div className="mt-2 text-[10px] text-slate-500">
                                            {section.content.length.toLocaleString()} caracteres
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Refiner info */}
                        {logData.refinerModel && (
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <p className="text-xs text-slate-500">
                                    <span className="font-medium">Modelo Refinador:</span> {logData.refinerModel}
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}