import React, { memo, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, Tag, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PRIORITY_CONFIG } from "./constants";

function PostCard({ post, postTypes, isDragging, onClick }) {
  const postType = useMemo(() => 
    postTypes?.find(pt => pt.id === post.post_type_id),
    [postTypes, post.post_type_id]
  );

  const priorityConfig = post.priority ? PRIORITY_CONFIG[post.priority] : null;

  return (
    <div 
      className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group relative ${
        isDragging ? 'shadow-lg ring-2 ring-pink-200' : ''
      }`}
      onClick={onClick}
    >
      {/* Grip Icon */}
      <div className="absolute right-2 top-2 text-slate-300">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Title */}
      <h4 className="font-medium text-slate-800 text-sm mb-2 pr-6 line-clamp-2">
        {post.title}
      </h4>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {postType && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-slate-50">
            <Tag className="w-3 h-3 mr-1" />
            {postType.title}
          </Badge>
        )}
        {priorityConfig && (
          <Badge className={`text-[10px] h-5 px-1.5 ${priorityConfig.color}`}>
            {priorityConfig.label}
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        {post.scheduled_date ? (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(post.scheduled_date), "dd MMM", { locale: ptBR })}
          </span>
        ) : (
          <span />
        )}
        {post.platform && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1">
            {post.platform}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default memo(PostCard);