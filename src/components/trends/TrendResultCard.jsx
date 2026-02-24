import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  BookmarkPlus, 
  ExternalLink, 
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check
} from "lucide-react";


// Parse content into individual news items
function parseContentIntoItems(content) {
  const items = [];
  const lines = content.split('\n');
  
  let currentItem = null;
  let currentContent = [];
  
  for (const line of lines) {
    // Detect bullet points with bold titles (like "**Título:** Conteúdo")
    const bulletMatch = line.match(/^[\*\-]\s+\*\*(.+?):\*\*\s*(.*)$/);
    // Detect numbered items with bold (like "1. **Título:** Conteúdo")
    const numberedBoldMatch = line.match(/^\d+\.\s+\*\*(.+?):\*\*\s*(.*)$/);
    // Detect just bold bullet points (like "- **Título** - Conteúdo")
    const simpleBoldMatch = line.match(/^[\*\-]\s+\*\*(.+?)\*\*[:\-]?\s*(.*)$/);
    
    if (bulletMatch || numberedBoldMatch || simpleBoldMatch) {
      // Save previous item
      if (currentItem) {
        items.push({
          title: currentItem,
          content: currentContent.join('\n').trim()
        });
      }
      
      const match = bulletMatch || numberedBoldMatch || simpleBoldMatch;
      currentItem = match[1].trim();
      currentContent = match[2] ? [match[2].trim()] : [];
    } else if (currentItem && line.trim() && !line.match(/^#+\s/) && !line.match(/^\d+\.\s+[A-Z]/)) {
      // Add continuation lines to current item (but not headers or new numbered sections)
      currentContent.push(line.trim());
    } else if (line.match(/^\d+\.\s+[A-Z]/) || line.match(/^#+\s/)) {
      // Save previous item before a new section header
      if (currentItem) {
        items.push({
          title: currentItem,
          content: currentContent.join('\n').trim()
        });
        currentItem = null;
        currentContent = [];
      }
    }
  }
  
  // Don't forget the last item
  if (currentItem) {
    items.push({
      title: currentItem,
      content: currentContent.join('\n').trim()
    });
  }
  
  return items;
}

export default function TrendResultCard({ result, onSave, isSaving }) {
  const [showSources, setShowSources] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [savingItemIndex, setSavingItemIndex] = useState(null);

  const parsedItems = useMemo(() => parseContentIntoItems(result.content), [result.content]);
  const annotations = result.annotations || [];

  const handleSaveItem = async (item, index) => {
    setSavingItemIndex(index);
    await onSave(item.title, item.content, annotations[0]?.url_citation);
    setSavingItemIndex(null);
  };

  const toggleItemSelection = (index) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleSaveSelected = async () => {
    for (const index of selectedItems) {
      const item = parsedItems[index];
      await onSave(item.title, item.content, annotations[0]?.url_citation);
    }
    setSelectedItems(new Set());
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Resultado da Pesquisa
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{result.subject}</Badge>
            {result.keyword && <Badge variant="outline">{result.keyword}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Parsed Items - Individual News */}
        {parsedItems.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 font-medium">
                {parsedItems.length} tendências encontradas
              </p>
              {selectedItems.size > 0 && (
                <Button 
                  size="sm" 
                  onClick={handleSaveSelected}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <BookmarkPlus className="w-3 h-3" />
                  )}
                  Salvar {selectedItems.size} selecionadas
                </Button>
              )}
            </div>

            {parsedItems.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-lg border transition-all ${
                  selectedItems.has(idx) 
                    ? 'border-indigo-300 bg-indigo-50/50' 
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedItems.has(idx)}
                    onCheckedChange={() => toggleItemSelection(idx)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSaveItem(item, idx)}
                    disabled={savingItemIndex === idx}
                    className="shrink-0"
                  >
                    {savingItemIndex === idx ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BookmarkPlus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Fallback: Show full content if parsing didn't find items */
          <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap text-slate-700">
            {result.content}
          </div>
        )}

        {/* Sources */}
        {annotations.length > 0 && (
          <div className="border-t pt-4">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Fontes ({annotations.length})
            </button>
            
            {showSources && (
              <div className="mt-3 space-y-2">
                {annotations.map((ann, idx) => (
                  <a
                    key={idx}
                    href={ann.url_citation?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {ann.url_citation?.title || "Fonte"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {ann.url_citation?.url}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}