import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Brain, Globe, Wrench, Bot } from 'lucide-react';
import { QUERY_KEYS } from '@/components/constants/queryKeys';

/**
 * ApprovedModelPicker - Seletor de modelos aprovados pelo admin
 * Usado em Multi Chat e Gerador de Scripts
 * Usuários veem apenas o alias, não o model_id real
 * 
 * @param {string[]} selectedModels - Array de model_ids selecionados
 * @param {function} onSelectionChange - Callback quando seleção muda
 * @param {number} maxSelection - Máximo de modelos (para Multi Chat)
 * @param {string} category - 'chat', 'script', ou 'both' para filtrar
 * @param {boolean} singleSelect - Se true, permite apenas 1 seleção
 */
export default function ApprovedModelPicker({ 
  selectedModels = [], 
  onSelectionChange, 
  maxSelection = 6,
  category = 'both',
  singleSelect = false
}) {
  // Fetch approved models
  const { data: approvedModels = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.APPROVED_MODELS],
    queryFn: () => base44.entities.ApprovedModel.filter({ is_active: true }, 'order', 100),
    staleTime: 60000
  });

  // Filter by category
  const filteredModels = approvedModels.filter(m => 
    m.category === 'both' || m.category === category
  );

  // Usa model.id (ID único do registro) para seleção, não model.model_id
  // Isso permite que o mesmo model_id apareça múltiplas vezes com configs diferentes
  const handleSelect = (recordId) => {
    if (singleSelect) {
      onSelectionChange([recordId]);
      return;
    }

    if (selectedModels.includes(recordId)) {
      onSelectionChange(selectedModels.filter(id => id !== recordId));
    } else if (selectedModels.length < maxSelection) {
      onSelectionChange([...selectedModels, recordId]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-2">
        {[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  if (filteredModels.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Bot className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="font-medium">Nenhum modelo disponível</p>
        <p className="text-sm">Entre em contato com o administrador.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {filteredModels.map(model => {
          const isSelected = selectedModels.includes(model.model_id);
          
          return (
            <div
              key={model.id}
              onClick={() => handleSelect(model.model_id)}
              className={`
                p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">{model.alias}</span>
                    {isSelected && (
                      <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {model.description && (
                    <p className="text-xs text-slate-500 mb-2">{model.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {model.supports_reasoning && (
                      <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                        <Brain className="w-3 h-3 mr-1" /> Deep Think
                        {model.reasoning_effort && (
                          <span className="ml-0.5 opacity-70">({model.reasoning_effort})</span>
                        )}
                      </Badge>
                    )}
                    {model.supports_web_search && (
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                        <Globe className="w-3 h-3 mr-1" /> Web
                      </Badge>
                    )}
                    {model.supports_tools && (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                        <Wrench className="w-3 h-3 mr-1" /> Tools
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}