import React from 'react';
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function RefinerButton({ onClick, disabled }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <Wand2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Refinar com IA</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}