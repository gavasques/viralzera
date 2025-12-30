import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StepPostType({ focusId, value, onChange }) {
    const { data: postTypes = [], isLoading } = useQuery({
        queryKey: ['postTypes', focusId],
        queryFn: () => base44.entities.PostType.filter({ focus_id: focusId, is_active: true }, 'title', 100),
        enabled: !!focusId
    });

    const handleSelect = (id) => {
        onChange({ ...value, postTypeId: id });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Selecione o Tipo de Postagem</h2>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Tipo de Postagem</h2>
                <p className="text-sm text-slate-500">Escolha o formato do conteúdo que deseja criar</p>
            </div>

            <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                    {postTypes.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Nenhum tipo de postagem encontrado</p>
                            <p className="text-sm">Crie tipos de postagem em Conteúdo → Tipos de Postagem</p>
                        </div>
                    ) : (
                        postTypes.map(pt => {
                            const isSelected = value.postTypeId === pt.id;
                            return (
                                <div
                                    key={pt.id}
                                    onClick={() => handleSelect(pt.id)}
                                    className={cn(
                                        "p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        isSelected
                                            ? "border-pink-500 bg-pink-50"
                                            : "border-slate-100 bg-white hover:border-slate-200"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-900">{pt.title}</span>
                                                {pt.format && (
                                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                        {pt.format}
                                                    </span>
                                                )}
                                                {isSelected && (
                                                    <div className="w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            {pt.description && (
                                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{pt.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            {value.postTypeId && (
                <div className="flex items-center space-x-2 pt-2 border-t">
                    <Switch
                        id="include-examples"
                        checked={value.includeExamples}
                        onCheckedChange={(checked) => onChange({ ...value, includeExamples: checked })}
                    />
                    <Label htmlFor="include-examples" className="text-sm text-slate-600">
                        Incluir exemplos de referência no prompt
                    </Label>
                </div>
            )}
        </div>
    );
}