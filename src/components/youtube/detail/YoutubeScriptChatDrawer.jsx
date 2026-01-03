import React from 'react';
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import YoutubeAIPanel from "./YoutubeAIPanel";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function YoutubeScriptChatDrawer({ open, onOpenChange, scriptId, scriptContext }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col gap-0 border-l border-slate-200 shadow-2xl">
         <VisuallyHidden><SheetTitle>Assistente IA</SheetTitle></VisuallyHidden>
         <YoutubeAIPanel scriptId={scriptId} scriptContext={scriptContext} />
      </SheetContent>
    </Sheet>
  );
}