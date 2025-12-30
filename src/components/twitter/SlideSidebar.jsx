import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Copy, GripVertical, LayoutTemplate, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TweetCard from "@/components/twitter/TweetCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SlideSidebar({ 
  slides, 
  activeSlideIndex, 
  onSelect, 
  onAdd, 
  onRemove, 
  onDuplicate,
  onReorder,
  config
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    onReorder(result.source.index, result.destination.index);
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-slate-100 w-12 shrink-0 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="p-2 border-b border-slate-100 flex flex-col items-center gap-2">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setIsCollapsed(false)}
            className="h-8 w-8"
            title="Expandir"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            onClick={onAdd}
            className="h-8 w-8"
            title="Nova Página"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 py-2 flex flex-col items-center gap-1 overflow-y-auto">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                idx === activeSlideIndex 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 w-64 shrink-0 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-xs">
          <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600" />
          Páginas ({slides.length})
        </h2>
        <div className="flex items-center gap-1">
          <Button 
            size="icon" 
            variant="outline" 
            onClick={onAdd}
            className="h-7 w-7 bg-white hover:bg-slate-50 border-slate-200"
            title="Adicionar Página"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setIsCollapsed(true)}
            className="h-7 w-7"
            title="Recolher"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-slate-50/30">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="slides-list">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="p-3 space-y-2"
              >
                {slides.map((slide, idx) => {
                  const slideText = typeof slide === 'string' ? slide : slide.text;
                  const slideObj = typeof slide === 'string' ? { text: slide } : slide;
                  
                  return (
                    <Draggable key={idx} draggableId={`slide-${idx}`} index={idx}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
                            group relative flex flex-col rounded-lg border transition-all cursor-pointer overflow-hidden
                            ${idx === activeSlideIndex 
                              ? 'bg-white border-indigo-500 ring-1 ring-indigo-500/10 shadow-md z-10' 
                              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'}
                            ${snapshot.isDragging ? 'shadow-xl rotate-1 scale-105 opacity-90' : ''}
                          `}
                          onClick={() => onSelect(idx)}
                        >
                          {/* Header */}
                          <div className="flex items-center gap-1.5 p-2 border-b border-slate-50 bg-white">
                            <div 
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                              <GripVertical className="w-3 h-3" />
                            </div>
                            <span className={`
                              flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0
                              ${idx === activeSlideIndex ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}
                            `}>
                              {idx + 1}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 flex-1 truncate">
                               {slideText ? 'Conteúdo' : 'Vazio'}
                            </span>
                            
                            {/* Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="w-3 h-3 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(idx); }}>
                                  <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
                                </DropdownMenuItem>
                                {slides.length > 1 && (
                                  <DropdownMenuItem 
                                    onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Remover
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Mini Preview - smaller */}
                          <div className="relative w-full aspect-[4/5] bg-slate-100 overflow-hidden">
                             <div className="absolute inset-0 flex items-center justify-center transform scale-[0.2] origin-top-left w-[500%] h-[500%] pointer-events-none select-none">
                                <div className="flex items-center justify-center w-full h-full p-8">
                                  <TweetCard 
                                    config={config}
                                    slide={slideObj}
                                    showArrow={slides.length > 1}
                                    arrowDirection={
                                      slides.length === 1 ? null :
                                      idx === 0 ? 'right' :
                                      idx === slides.length - 1 ? 'left' : 'both'
                                    }
                                    scale={1} 
                                  />
                                </div>
                             </div>
                             
                             {/* Overlay when not active */}
                             {idx !== activeSlideIndex && (
                               <div className="absolute inset-0 bg-white/10 hover:bg-transparent transition-colors" />
                             )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        <div className="p-3 pt-0">
          <Button 
            variant="outline" 
            className="w-full border-dashed border py-4 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-lg text-xs"
            onClick={onAdd}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Nova Página
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}