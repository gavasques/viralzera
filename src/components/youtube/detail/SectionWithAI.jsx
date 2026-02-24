import React from 'react';
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import YoutubeScriptSectionEditor from './YoutubeScriptSectionEditor';

export default function SectionWithAI({ 
  sectionKey, 
  title, 
  description, 
  value, 
  onChange,
  onOpenAssistant
}) {
  return (
    <div className="relative group">
      <YoutubeScriptSectionEditor
        sectionKey={sectionKey}
        title={title}
        description={description}
        content={value}
        onChange={onChange}
      />
      
      {/* AI Assistant Button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-3 right-3 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 shadow-sm"
        onClick={() => onOpenAssistant(sectionKey)}
        title="Abrir Assistente de IA"
      >
        <Wand2 className="w-4 h-4" />
      </Button>
    </div>
  );
}