import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import YoutubeAIPanel from "./YoutubeAIPanel";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function YoutubeScriptChatDrawer({ open, onOpenChange, scriptId, scriptContext }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] p-0 flex flex-col gap-0 overflow-hidden bg-white border-slate-100 shadow-2xl rounded-xl">
         <VisuallyHidden><DialogTitle>Assistente IA</DialogTitle></VisuallyHidden>
         <YoutubeAIPanel scriptId={scriptId} scriptContext={scriptContext} />
      </DialogContent>
    </Dialog>
  );
}