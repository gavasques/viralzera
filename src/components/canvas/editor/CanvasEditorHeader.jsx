import React from "react";
import { FileText } from "lucide-react";

export default function CanvasEditorHeader() {
  return (
    <div className="flex items-center px-4 py-2.5 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white shrink-0">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-indigo-100 rounded-lg">
          <FileText className="w-4 h-4 text-indigo-600" />
        </div>
        <span className="font-semibold text-sm text-slate-700">Canvas Editor</span>
      </div>
    </div>
  );
}