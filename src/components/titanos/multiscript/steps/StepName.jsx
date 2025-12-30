import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Calendar } from 'lucide-react';

export function StepName({ value, onChange }) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Nome do Chat</h2>
                <p className="text-slate-500 mt-2">Como você gostaria de identificar esta sessão?</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Título da Conversa</Label>
                    <Input 
                        value={value.title}
                        onChange={(e) => onChange({ ...value, title: e.target.value })}
                        placeholder="Ex: Script Reels - Lançamento Produto X"
                        className="h-12 text-base"
                        autoFocus
                    />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                    <Calendar className="w-4 h-4" />
                    <span>Criado em: {new Date().toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                </div>
            </div>
        </div>
    );
}