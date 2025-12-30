import React from 'react';
import { Eye, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function HiddenModelsBar({ hiddenModels, onShow }) {
    if (!hiddenModels || hiddenModels.length === 0) return null;

    return (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-amber-700 font-medium">Modelos ocultos:</span>
            {hiddenModels.map(modelId => {
                const displayName = modelId.split('/')[1] || modelId;
                return (
                    <Button
                        key={modelId}
                        variant="outline"
                        size="sm"
                        onClick={() => onShow(modelId)}
                        className="h-6 px-2 text-[10px] bg-white border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                    >
                        <Bot className="w-3 h-3 mr-1" />
                        {displayName}
                        <Eye className="w-3 h-3 ml-1" />
                    </Button>
                );
            })}
        </div>
    );
}