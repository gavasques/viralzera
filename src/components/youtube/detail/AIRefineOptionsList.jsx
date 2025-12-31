import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function AIRefineOptionsList({ options, onSelect }) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-slate-900 mb-3">Escolha uma ação:</h3>
      
      {options.map((option) => (
        <Button
          key={option.action}
          variant="outline"
          className="w-full justify-between h-auto py-3 px-4 hover:bg-purple-50 hover:border-purple-200 group"
          onClick={() => onSelect(option.action)}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{option.icon}</span>
            <span className="font-medium">{option.label}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
        </Button>
      ))}
    </div>
  );
}