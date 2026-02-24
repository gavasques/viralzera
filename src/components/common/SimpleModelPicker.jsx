import React, { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { neon } from '@/api/neonClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Bot } from 'lucide-react';
import { QUERY_KEYS } from '@/components/constants/queryKeys';

/**
 * SimpleModelPicker - Versão simplificada do seletor de modelos
 * Mostra apenas nome e descrição, sem badges de capacidades
 * Usado em modais de MultiScript
 */
function SimpleModelPicker({ 
  selectedModels = [], 
  onSelectionChange, 
  maxSelection = 6,
  category = 'both',
  models: preloadedModels = null
}) {
  const { data: fetchedModels = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.APPROVED_MODELS],
    queryFn: () => neon.entities.ApprovedModel.filter({ is_active: true }, 'order', 100),
    staleTime: 5 * 60 * 1000,
    enabled: !preloadedModels
  });
  
  const approvedModels = preloadedModels || fetchedModels;

  const filteredModels = useMemo(() => 
    approvedModels.filter(m => m.category === 'both' || m.category === category),
    [approvedModels, category]
  );

  const handleSelect = (recordId) => {
    if (selectedModels.includes(recordId)) {
      onSelectionChange(selectedModels.filter(id => id !== recordId));
    } else if (selectedModels.length < maxSelection) {
      onSelectionChange([...selectedModels, recordId]);
    }
  };

  if (!preloadedModels && isLoading) {
    return (
      <div className="space-y-3 p-2">
        {[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  if (filteredModels.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Bot className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="font-medium">Nenhum modelo disponível</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {filteredModels.map(model => {
          const isSelected = selectedModels.includes(model.id);
          
          return (
            <div
              key={model.id}
              onClick={() => handleSelect(model.id)}
              className={`
                p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{model.alias}</span>
                    {isSelected && (
                      <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  {model.description && (
                    <p className="text-xs text-slate-500 mt-1">{model.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export default memo(SimpleModelPicker);