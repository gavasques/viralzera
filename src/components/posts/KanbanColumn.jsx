import React, { memo } from 'react';
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import PostCard from "./PostCard";

function KanbanColumn({ 
  column, 
  posts, 
  postTypes,
  onAddNew, 
  onEditPost 
}) {
  const Icon = column.icon;

  return (
    <div className={`min-w-[280px] flex-1 flex flex-col rounded-xl border ${column.borderColor} ${column.bgLight}`}>
      {/* Header */}
      <div className="p-3 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${column.color}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800">{column.title}</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-white/60">
              {posts.length}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-slate-400 hover:text-slate-600"
            onClick={() => onAddNew(column.id)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Droppable Content */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div 
            className="flex-1 p-2 overflow-y-auto"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <div className={`min-h-[200px] rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-white/50' : ''}`}>
              {posts.map((post, index) => (
                <Draggable key={post.id} draggableId={post.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={provided.draggableProps.style}
                      className={`mb-2 ${snapshot.isDragging ? 'rotate-2 z-50' : ''}`}
                    >
                      <PostCard 
                        post={post} 
                        postTypes={postTypes}
                        isDragging={snapshot.isDragging}
                        onClick={() => onEditPost(post)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default memo(KanbanColumn);