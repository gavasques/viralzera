import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Brain, Globe, Wrench, Settings2, Pencil, Trash2, GripVertical } from 'lucide-react';

export default function ApprovedModelCard({ model, onToggleActive, onEdit, onDelete, isUpdating }) {
  return (
    <Card className={`transition-all ${model.is_active ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50/50 opacity-60'}`}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="text-slate-300 cursor-grab">
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-slate-900">{model.alias}</span>
            {model.supports_reasoning && (
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                <Brain className="w-3 h-3 mr-1" /> Deep Think
                {model.reasoning_effort && <span className="ml-0.5 opacity-70">({model.reasoning_effort})</span>}
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
            {model.parameters && Object.keys(model.parameters).length > 0 && (
              <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 border-slate-200">
                <Settings2 className="w-3 h-3 mr-1" /> Params
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {model.category === 'both' ? 'Chat + Script' : model.category === 'chat' ? 'Multi Chat' : 'Script'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">{model.model_id}</p>
          {model.description && (
            <p className="text-xs text-slate-500 mt-1">{model.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={model.is_active}
            onCheckedChange={onToggleActive}
            disabled={isUpdating}
          />
          <Button variant="ghost" size="icon" onClick={onEdit} disabled={isUpdating}>
            <Pencil className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} disabled={isUpdating}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}