import React, { memo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

function KanbanBoard({ 
  columns,
  getPostsByStatus, 
  postTypes,
  onDragEnd,
  onColumnDragEnd,
  onAddNew, 
  onEditPost,
  onAddColumn,
  onDeleteColumn,
  onRenameColumn,
  onToggleComplete
}) {
  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;
    
    const { source, destination, type } = result;

    if (type === 'COLUMN') {
      if (source.index !== destination.index) {
        onColumnDragEnd(source.index, destination.index);
      }
      return;
    }

    // Card drag
    onDragEnd(result.draggableId, destination.droppableId);
  }, [onDragEnd, onColumnDragEnd]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" type="COLUMN" direction="horizontal">
        {(provided) => (
          <div 
            ref={provided.innerRef} 
            {...provided.droppableProps}
            className="flex-1 flex gap-4 overflow-x-auto pb-4 min-h-[500px] w-full"
          >
            {columns.map((column, index) => (
              <Draggable key={column.id} draggableId={column.id} index={index}>
                {(dragProvided) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                  >
                    <KanbanColumn
                      column={column}
                      posts={getPostsByStatus(column.slug)}
                      postTypes={postTypes}
                      onAddNew={onAddNew}
                      onEditPost={onEditPost}
                      onDelete={onDeleteColumn}
                      onRename={onRenameColumn}
                      onToggleComplete={onToggleComplete}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {/* Add Column Button */}
            <div className="pt-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-10 w-10 rounded-full border border-dashed border-slate-300 text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-400 transition-colors"
                onClick={onAddColumn}
                title="Adicionar Nova Coluna"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default memo(KanbanBoard);