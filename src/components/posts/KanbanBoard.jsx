import React, { memo, useCallback } from 'react';
import { DragDropContext } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";
import { COLUMNS } from "./constants";

function KanbanBoard({ 
  getPostsByStatus, 
  postTypes,
  onDragEnd, 
  onAddNew, 
  onEditPost 
}) {
  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    onDragEnd(draggableId, destination.droppableId);
  }, [onDragEnd]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            posts={getPostsByStatus(column.id)}
            postTypes={postTypes}
            onAddNew={onAddNew}
            onEditPost={onEditPost}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

export default memo(KanbanBoard);