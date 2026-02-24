import React, { memo } from 'react';
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Trash, Pencil, Circle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PostCard from "./PostCard";

function KanbanColumn({ 
  column, 
  posts, 
  postTypes,
  onAddNew, 
  onEditPost,
  onDelete,
  onRename,
  onToggleComplete
}) {
  const Icon = column.icon || Circle;

  return (
    <div className={`min-w-[280px] w-[280px] flex flex-col rounded-xl border bg-slate-50 border-slate-200 ${column.bgLight || ''}`}>
      {/* Header */}
      <div className="p-3 border-b border-slate-200/50 flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${column.color || 'bg-slate-400'}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800 truncate max-w-[120px]" title={column.title}>
            {column.title}
          </span>
          <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-white/60">
            {posts.length}
          </Badge>
        </div>
        
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-slate-400 hover:text-slate-600"
            onClick={() => onAddNew(column.slug)}
          >
            <Plus className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRename(column)}>
                <Pencil className="w-4 h-4 mr-2" /> Renomear
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(column)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Droppable Content */}
      <Droppable droppableId={column.slug}>
        {(provided, snapshot) => (
          <div 
            className={`flex-1 p-2 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-slate-100/50' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {posts.map((post, index) => (
              <Draggable key={post.id} draggableId={post.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    style={dragProvided.draggableProps.style}
                    className={`mb-2 ${dragSnapshot.isDragging ? 'rotate-2 z-50' : ''}`}
                  >
                    <PostCard 
                      post={post} 
                      postTypes={postTypes}
                      isDragging={dragSnapshot.isDragging}
                      onClick={() => onEditPost(post)}
                      onToggleComplete={onToggleComplete}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default memo(KanbanColumn);