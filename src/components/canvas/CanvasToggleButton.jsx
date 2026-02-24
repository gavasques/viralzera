import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, PanelRight } from "lucide-react";
import { useCanvas } from './CanvasProvider';

export default function CanvasToggleButton({ variant = "default", className = "" }) {
  const { toggleCanvas, isOpen } = useCanvas();

  if (variant === "floating") {
    return (
      <Button
        onClick={toggleCanvas}
        className={`fixed bottom-6 right-6 h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 z-40 ${className}`}
      >
        <FileText className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleCanvas}
      className={`gap-2 ${isOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''} ${className}`}
    >
      <PanelRight className="w-4 h-4" />
      <span className="hidden sm:inline">Canvas</span>
    </Button>
  );
}