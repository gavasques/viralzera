import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Library, FileText } from 'lucide-react';

export function StepRefinement({ focusId, value, onChange }) {
    const { data: materials = [], isLoading } = useQuery({
        queryKey: ['materials', focusId],
        queryFn: () => base44.entities.Material.filter({ focus_id: focusId }, 'title', 50),
        enabled: !!focusId
    });

    const handleMaterialToggle = (materialId) => {
        const current = value.selectedMaterials || [];
        const updated = current.includes(materialId)
            ? current.filter(id => id !== materialId)
            : [...current, materialId];
        onChange({ ...value, selectedMaterials: updated });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Refinamento</h2>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Refinamento</h2>
                <p className="text-sm text-slate-500">Adicione materiais de apoio e instruções extras (opcional)</p>
            </div>

            {/* Materials Selection */}
            <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Library className="w-4 h-4" /> Materiais de Apoio
                </Label>
                <ScrollArea className="h-[200px] border rounded-lg p-3">
                    <div className="space-y-2">
                        {materials.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                <p className="text-sm">Nenhum material encontrado</p>
                            </div>
                        ) : (
                            materials.map(mat => {
                                const isSelected = (value.selectedMaterials || []).includes(mat.id);
                                return (
                                    <div
                                        key={mat.id}
                                        className="flex items-center space-x-3 p-2 rounded hover:bg-slate-50"
                                    >
                                        <Checkbox
                                            id={`mat-${mat.id}`}
                                            checked={isSelected}
                                            onCheckedChange={() => handleMaterialToggle(mat.id)}
                                        />
                                        <label
                                            htmlFor={`mat-${mat.id}`}
                                            className="text-sm text-slate-700 cursor-pointer flex-1"
                                        >
                                            {mat.title}
                                        </label>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* User Notes */}
            <div className="space-y-3">
                <Label htmlFor="user-notes" className="text-sm font-medium text-slate-700">
                    Instruções Adicionais
                </Label>
                <Textarea
                    id="user-notes"
                    placeholder="Adicione instruções específicas, contexto extra ou detalhes importantes para a geração do script..."
                    value={value.userNotes || ''}
                    onChange={(e) => onChange({ ...value, userNotes: e.target.value })}
                    className="h-[150px] resize-none"
                />
                <p className="text-xs text-slate-400">
                    Essas instruções serão incluídas no prompt enviado para as IAs.
                </p>
            </div>
        </div>
    );
}