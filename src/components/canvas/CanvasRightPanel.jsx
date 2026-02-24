import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, History, StickyNote, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CanvasAIPanel from "./CanvasAIPanel";
import CanvasHistoryPanel from "./CanvasHistoryPanel";
import CanvasNotesPanel from "./CanvasNotesPanel";

export default function CanvasRightPanel({ 
  canvas, 
  onUpdateCanvas, 
  history, 
  onRestoreHistory,
  onSaveNotes,
  isSaving,
  onClose
}) {
  const [activeTab, setActiveTab] = useState("ai");

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
        {/* Tab Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between px-2 pt-2 pb-1 border-b border-slate-100 bg-slate-50/50">
          <TabsList className="bg-transparent h-9 p-0 gap-1">
            <TabsTrigger 
              value="ai" 
              className="h-9 px-3 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 border border-transparent data-[state=active]:border-slate-200"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              IA
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="h-9 px-3 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-yellow-600 border border-transparent data-[state=active]:border-slate-200"
            >
              <StickyNote className="w-3.5 h-3.5 mr-1.5" />
              Notas
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="h-9 px-3 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-600 border border-transparent data-[state=active]:border-slate-200"
            >
              <History className="w-3.5 h-3.5 mr-1.5" />
              Histórico
            </TabsTrigger>
          </TabsList>
          
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-slate-600">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="ai" className="h-full m-0 p-0 data-[state=inactive]:hidden">
            <CanvasAIPanel 
              canvasId={canvas?.id}
              canvasContent={canvas?.content || ""} 
              canvasTitle={canvas?.title || ""}
              onApplyContent={(newContent) => onUpdateCanvas({ content: newContent })}
              onClose={() => {}}
              embedded={true}
            />
          </TabsContent>
          
          <TabsContent value="notes" className="h-full m-0 p-0 overflow-y-auto data-[state=inactive]:hidden">
            <CanvasNotesPanel canvasId={canvas?.id} />
          </TabsContent>
          
          <TabsContent value="history" className="h-full m-0 p-0 overflow-y-auto data-[state=inactive]:hidden">
            <CanvasHistoryPanel history={history} onRestore={onRestoreHistory} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}