import React from 'react';
import { Label } from "@/components/ui/label";
import { Bot } from 'lucide-react';
import SimpleModelPicker from '@/components/common/SimpleModelPicker';

export function StepModels({ value, onChange }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
            <div className="space-y-2">
                <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    Selecione as Inteligências
                </Label>
                <p className="text-sm text-slate-500">
                    Escolha quais modelos de IA irão gerar scripts para você comparar.
                </p>
            </div>

            <div className="flex-1 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50 min-h-[300px]">
                <SimpleModelPicker 
                    selectedModels={value.selectedModels || []} 
                    onSelectionChange={(models) => onChange({ ...value, selectedModels: models })} 
                    maxSelection={6}
                    category="chat"
                />
            </div>

            <div className="text-center text-xs text-slate-400">
                {(value.selectedModels || []).length > 0 
                    ? `${(value.selectedModels || []).length}/6 modelos selecionados`
                    : 'Selecione até 6 modelos para comparação'
                }
            </div>
        </div>
    );
}