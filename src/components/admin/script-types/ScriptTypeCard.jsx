import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, FileText, Video, BookOpen, List, Lightbulb, Target, Layers, MessageSquare, Zap } from "lucide-react";

const ICON_MAP = {
  FileText,
  Video,
  BookOpen,
  List,
  Lightbulb,
  Target,
  Layers,
  MessageSquare,
  Zap,
};

export default function ScriptTypeCard({ scriptType, onEdit }) {
  // Get icon from map or default to FileText
  const IconComponent = ICON_MAP[scriptType.icon] || FileText;
  
  const promptPreview = scriptType.prompt_template
    ? scriptType.prompt_template.substring(0, 100) + (scriptType.prompt_template.length > 100 ? '...' : '')
    : 'Sem prompt definido';

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <IconComponent className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                {scriptType.title}
              </CardTitle>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="text-slate-400 hover:text-slate-600"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {scriptType.description && (
          <p className="text-sm text-slate-500 mb-3 line-clamp-2">
            {scriptType.description}
          </p>
        )}
        
        <div className="bg-slate-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-slate-400 mb-1">Preview do Prompt:</p>
          <p className="text-xs text-slate-600 font-mono line-clamp-2">
            {promptPreview}
          </p>
        </div>

        {scriptType.prompt_template && (
          <Badge variant="secondary" className="text-xs">
            {scriptType.prompt_template.length.toLocaleString()} caracteres
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}