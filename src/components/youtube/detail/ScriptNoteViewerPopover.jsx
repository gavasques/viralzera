import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const NOTE_COLORS = {
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
};

const NOTE_BORDER_COLORS = {
    yellow: "border-yellow-200",
    blue: "border-blue-200",
    green: "border-green-200",
    red: "border-red-200",
    purple: "border-purple-200",
};

export default function ScriptNoteViewerPopover({ 
  note, 
  position, 
  onClose,
  onDelete
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!note || !position) return null;

  const style = {
    position: 'fixed',
    left: position.x,
    top: position.bottom + 10,
    zIndex: 9999,
    transform: 'translateX(-50%)',
  };

  // Prevent going off-screen
  if (typeof window !== 'undefined') {
      const width = 320; // approximate width
      if (style.left < width / 2) style.left = width / 2 + 10;
      if (style.left > window.innerWidth - width / 2) style.left = window.innerWidth - width / 2 - 10;
      
      // Check bottom edge
      if (style.top + 200 > window.innerHeight) {
          style.top = position.y - 10;
          style.transform = 'translate(-50%, -100%)';
      }
  }

  const colorClass = NOTE_COLORS[note.color || 'yellow'];
  const borderClass = NOTE_BORDER_COLORS[note.color || 'yellow'];

  return createPortal(
    <div
      ref={popoverRef}
      style={style}
      className={`bg-white rounded-lg shadow-xl border ${borderClass} w-80 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
    >
      <div className={`flex justify-between items-center px-3 py-2 ${colorClass} bg-opacity-30`}>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-${note.color || 'yellow'}-500`} />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Nota</span>
        </div>
        <div className="flex gap-1">
            {onDelete && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 hover:bg-white/50 text-slate-500 hover:text-red-600 rounded-full" 
                    onClick={() => onDelete(note.id)}
                    title="Excluir nota"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            )}
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-white/50 text-slate-500 rounded-full" 
                onClick={onClose}
            >
                <X className="w-3.5 h-3.5" />
            </Button>
        </div>
      </div>
      
      <div className="p-4 bg-white">
        {note.quote && (
            <div className="mb-3 pl-3 border-l-2 border-slate-200 italic text-xs text-slate-500 line-clamp-3">
                "{note.quote}"
            </div>
        )}
        
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {note.note}
        </p>

        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-50">
            <Calendar className="w-3 h-3" />
            <span>
                {note.created_date ? format(new Date(note.created_date), "d 'de' MMM 'às' HH:mm", { locale: ptBR }) : 'Data desconhecida'}
            </span>
        </div>
      </div>
    </div>,
    document.body
  );
}