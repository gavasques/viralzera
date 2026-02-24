import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function RefinerOptionButton({ option, onClick, disabled }) {
  return (
    <Button
      variant="outline"
      className="w-full justify-between h-auto py-3 px-4 text-left"
      onClick={onClick}
      disabled={disabled}
    >
      <div>
        <div className="font-medium text-slate-900">{option.label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{option.description}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
    </Button>
  );
}