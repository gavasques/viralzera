import React from "react";
import { Button } from "@/components/ui/button";

export default function CanvasEditorFooter({ isEditMode, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white/80 backdrop-blur-sm z-20 shrink-0">
      <div className="text-sm text-slate-500">
        {isEditMode ? "Modo Edição" : "Modo Leitura"}
      </div>
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="border-slate-200 text-slate-700 hover:bg-slate-50 px-8"
        >
          Fechar
        </Button>
      </div>
    </div>
  );
}