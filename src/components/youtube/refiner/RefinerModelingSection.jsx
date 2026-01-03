import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Database } from "lucide-react";

export default function RefinerModelingSection({ enabled, onToggle, modelingCount }) {
  return (
    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-100">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Database className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <Label htmlFor="use-modelings" className="text-sm font-medium text-slate-900">
            Usar Dossiês de Referência
          </Label>
          <p className="text-xs text-slate-500">
            {modelingCount} dossiê{modelingCount > 1 ? 's' : ''} vinculado{modelingCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <Switch
        id="use-modelings"
        checked={enabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}