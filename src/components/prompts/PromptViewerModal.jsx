import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, MessageCircle, Copy, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PromptViewerModal({ open, onOpenChange, prompt, onEdit }) {
    if (!prompt) return null;
    
    const isSystem = prompt.type === 'system_prompt';

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt.content);
        toast.success('Prompt copiado!');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
                <DialogHeader className="shrink-0">
                    <div className="flex items-start justify-between gap-4 pr-8">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSystem ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                {isSystem ? <Bot className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                            </div>
                            <div>
                                <DialogTitle className="text-lg">{prompt.title}</DialogTitle>
                                <Badge variant="outline" className={`mt-1 text-xs ${isSystem ? 'border-purple-200 text-purple-700 bg-purple-50' : 'border-blue-200 text-blue-700 bg-blue-50'}`}>
                                    {isSystem ? 'System Prompt' : 'User Prompt'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
                    {prompt.description && (
                        <p className="text-sm text-slate-600">{prompt.description}</p>
                    )}

                    <div className="flex-1 overflow-hidden">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                            Conteúdo
                        </label>
                        <ScrollArea className="h-[300px] w-full rounded-lg border border-slate-200 bg-slate-50">
                            <pre className="p-4 text-sm text-slate-800 whitespace-pre-wrap font-mono leading-relaxed">
                                {prompt.content}
                            </pre>
                        </ScrollArea>
                    </div>

                    {(prompt.category || (prompt.tags && prompt.tags.length > 0)) && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                            {prompt.category && (
                                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                    {prompt.category}
                                </span>
                            )}
                            {prompt.tags?.map((tag, i) => (
                                <span key={i} className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                    <Button variant="outline" onClick={() => { onOpenChange(false); onEdit?.(); }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                    </Button>
                    <Button onClick={handleCopy} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Prompt
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}