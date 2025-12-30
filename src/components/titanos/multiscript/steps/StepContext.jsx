import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { User, Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StepContext({ focusId, value, onChange }) {
    const { data: personas = [], isLoading: loadingPersonas } = useQuery({
        queryKey: ['personas', focusId],
        queryFn: () => base44.entities.Persona.filter({ focus_id: focusId }, 'name', 50),
        enabled: !!focusId
    });

    const { data: audiences = [], isLoading: loadingAudiences } = useQuery({
        queryKey: ['audiences', focusId],
        queryFn: () => base44.entities.Audience.filter({ focus_id: focusId }, 'name', 50),
        enabled: !!focusId
    });

    const isLoading = loadingPersonas || loadingAudiences;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Contexto</h2>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Contexto</h2>
                <p className="text-sm text-slate-500">Selecione a persona e o público-alvo (opcional)</p>
            </div>

            {/* Personas */}
            <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4" /> Persona
                </Label>
                <ScrollArea className="h-[180px]">
                    <div className="space-y-2 pr-4">
                        {personas.length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center">Nenhuma persona encontrada</p>
                        ) : (
                            personas.map(p => {
                                const isSelected = value.personaId === p.id;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => onChange({ ...value, personaId: isSelected ? '' : p.id })}
                                        className={cn(
                                            "p-3 rounded-lg border cursor-pointer transition-all",
                                            isSelected
                                                ? "border-pink-500 bg-pink-50"
                                                : "border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-900">{p.name}</span>
                                            {isSelected && (
                                                <div className="w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Audiences */}
            <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Público-Alvo
                </Label>
                <ScrollArea className="h-[180px]">
                    <div className="space-y-2 pr-4">
                        {audiences.length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center">Nenhum público encontrado</p>
                        ) : (
                            audiences.map(a => {
                                const isSelected = value.audienceId === a.id;
                                return (
                                    <div
                                        key={a.id}
                                        onClick={() => onChange({ ...value, audienceId: isSelected ? '' : a.id })}
                                        className={cn(
                                            "p-3 rounded-lg border cursor-pointer transition-all",
                                            isSelected
                                                ? "border-pink-500 bg-pink-50"
                                                : "border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-medium text-slate-900">{a.name}</span>
                                                {a.funnel_stage && (
                                                    <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                                        {a.funnel_stage}
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <div className="w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}