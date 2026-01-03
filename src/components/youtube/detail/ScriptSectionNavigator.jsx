import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronUp, 
  ChevronDown, 
  List,
  X
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ScriptSectionNavigator({ content, editorRef }) {
  const [isOpen, setIsOpen] = useState(false);

  // Extract headers/sections from content
  const sections = useMemo(() => {
    if (!content) return [];
    
    const tmp = document.createElement('div');
    tmp.innerHTML = content;
    
    const headers = [];
    const elements = tmp.querySelectorAll('h1, h2, h3');
    
    elements.forEach((el, index) => {
      const text = el.textContent?.trim();
      if (text) {
        headers.push({
          id: index,
          text: text.length > 40 ? text.substring(0, 40) + '...' : text,
          fullText: text,
          level: parseInt(el.tagName[1]),
        });
      }
    });
    
    return headers;
  }, [content]);

  // Navigate to section in editor
  const handleNavigateToSection = (section) => {
    if (!editorRef?.current) return;
    
    try {
      const editor = editorRef.current.getEditor();
      const editorContent = editor.root.innerHTML;
      
      // Find the section text in the editor
      const plainText = editor.getText();
      const sectionIndex = plainText.indexOf(section.fullText);
      
      if (sectionIndex !== -1) {
        // Set cursor to section
        editor.setSelection(sectionIndex, 0);
        
        // Scroll to position
        const bounds = editor.getBounds(sectionIndex);
        const editorContainer = editor.container.querySelector('.ql-editor');
        if (editorContainer && bounds) {
          editorContainer.scrollTop = bounds.top - 100;
        }
      }
      
      setIsOpen(false);
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };

  if (sections.length === 0) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 px-3 text-slate-600 hover:text-slate-900"
        >
          <List className="w-4 h-4 mr-2" />
          Seções
          <span className="ml-1.5 text-xs text-slate-400">({sections.length})</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="p-3 border-b border-slate-100">
          <h4 className="font-semibold text-sm text-slate-900">Navegação por Seções</h4>
          <p className="text-xs text-slate-500 mt-0.5">Clique para ir até a seção</p>
        </div>
        <ScrollArea className="max-h-64">
          <div className="p-2">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => handleNavigateToSection(section)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-slate-100 flex items-start gap-2 ${
                  section.level === 1 ? 'font-semibold' : 
                  section.level === 2 ? 'pl-5 font-medium' : 
                  'pl-8 text-slate-600'
                }`}
              >
                <span className={`shrink-0 w-5 h-5 rounded text-[10px] flex items-center justify-center ${
                  section.level === 1 ? 'bg-red-100 text-red-700' :
                  section.level === 2 ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  H{section.level}
                </span>
                <span className="truncate">{section.text}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}