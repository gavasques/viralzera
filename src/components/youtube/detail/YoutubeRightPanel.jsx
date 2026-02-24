import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import YoutubeAIPanel from "./YoutubeAIPanel";

export default function YoutubeRightPanel({ 
  scriptId,
  scriptContext,
  onClose
}) {
  const [activeTab, setActiveTab] = useState("ai");

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden border-l border-slate-200 shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
        {/* Tab Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between px-2 pt-2 pb-1 border-b border-slate-100 bg-slate-50/50">
          <TabsList className="bg-transparent h-9 p-0 gap-1">
            <TabsTrigger 
              value="ai" 
              className="h-9 px-3 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600 border border-transparent data-[state=active]:border-slate-200"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              IA
            </TabsTrigger>
          </TabsList>
          
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-slate-600">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="ai" className="h-full m-0 p-0 data-[state=inactive]:hidden">
            <YoutubeAIPanel 
              scriptId={scriptId}
              scriptContext={scriptContext}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}