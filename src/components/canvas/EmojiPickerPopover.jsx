import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EMOJI_CATEGORIES = {
  numbers: {
    label: "Números",
    emojis: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "0️⃣", "#️⃣", "*️⃣"]
  },
  hands: {
    label: "Mãos",
    emojis: ["👉", "👈", "👆", "👇", "👍", "👎", "👋", "👏", "🙌", "🤝", "👊", "✌️", "💪", "✍️"]
  },
  arrows: {
    label: "Setas",
    emojis: ["➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↔️", "↕️", "↪️", "↩️", "⏩", "⏪"]
  },
  symbols: {
    label: "Símbolos",
    emojis: ["✨", "💡", "🔥", "🚀", "⚠️", "✅", "❌", "🟢", "🔴", "🔷", "🔶", "⭐", "💎", "🎯", "📌", "📍", "📝"]
  },
  faces: {
    label: "Carinhas",
    emojis: ["😀", "😂", "😉", "😎", "🤔", "🤨", "😐", "🙄", "😤", "🤯", "😱", "🥳", "🤩", "🤑"]
  }
};

export default function EmojiPickerPopover({ onEmojiSelect }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 gap-2 border-slate-200 hover:bg-slate-50 text-slate-600"
          title="Inserir Emoji"
        >
          <Smile className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Tabs defaultValue="numbers" className="w-full">
          <div className="border-b border-slate-100 bg-slate-50/50 p-2">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
              {Object.entries(EMOJI_CATEGORIES).map(([key, cat]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="text-xs px-2 py-1 h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {Object.entries(EMOJI_CATEGORIES).map(([key, cat]) => (
            <TabsContent key={key} value={key} className="m-0">
              <ScrollArea className="h-[200px] w-full p-3">
                <div className="grid grid-cols-6 gap-2">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onEmojiSelect(emoji)}
                      className="flex items-center justify-center w-8 h-8 text-xl hover:bg-slate-100 rounded-md transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}