import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Smile, 
  Type,
  Minus,
  Plus,
  Trash2,
  Image as ImageIcon
} from "lucide-react";

const EMOJI_CATEGORIES = {
  "Populares": ["😀", "😂", "🥰", "😎", "🔥", "💯", "🚀", "💪", "👏", "🙌", "❤️", "💰", "✨", "⭐", "🎯", "💡"],
  "Rostos": ["😊", "😁", "🤣", "😅", "😍", "🤩", "😏", "🤔", "🤯", "😤", "😱", "🥳", "😈", "💀", "🤡", "👀"],
  "Gestos": ["👍", "👎", "✌️", "🤞", "🤙", "👊", "✊", "🤝", "🙏", "💅", "🤷", "🙅", "🙋", "💃", "🕺", "🧠"],
  "Objetos": ["💼", "📈", "📊", "💻", "📱", "🎯", "🏆", "🎁", "💎", "🔑", "⚡", "🌟", "🎉", "🎊", "📌", "🔔"],
  "Símbolos": ["✅", "❌", "⚠️", "🔴", "🟢", "🔵", "⬆️", "⬇️", "➡️", "⬅️", "↗️", "🔄", "💲", "📍", "🏷️", "🎬"]
};

export default function TextEditorToolbar({ 
  text, 
  onTextChange, 
  fontSize, 
  onFontSizeChange,
  textareaRef,
  onAddImage
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = React.useRef(null);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("Populares");

  const insertAtCursor = (insertText) => {
    const textarea = textareaRef?.current;
    if (!textarea) {
      onTextChange(text + insertText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + insertText + text.substring(end);
    onTextChange(newText);
    
    // Restore cursor position after insert
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 0);
  };

  const wrapSelection = (prefix, suffix = prefix) => {
    const textarea = textareaRef?.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    
    if (selectedText) {
      const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
      onTextChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    }
  };

  const handleEmojiClick = (emoji) => {
    insertAtCursor(emoji);
    setEmojiOpen(false);
  };

  const clearText = () => {
    onTextChange("");
  };

  const transformText = (type) => {
    const textarea = textareaRef?.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);

    if (!selectedText) return;

    let transformed = selectedText;
    switch(type) {
      case 'upper':
        transformed = selectedText.toUpperCase();
        break;
      case 'lower':
        transformed = selectedText.toLowerCase();
        break;
      case 'capitalize':
        transformed = selectedText.split(' ').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' ');
        break;
    }

    const newText = text.substring(0, start) + transformed + text.substring(end);
    onTextChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + transformed.length);
    }, 0);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-t-lg">
      {/* Format Buttons */}
      <div className="flex items-center border-r border-slate-200 pr-2 mr-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => wrapSelection('**')}
          className="h-8 w-8"
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => wrapSelection('_')}
          className="h-8 w-8"
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => wrapSelection('__', '__')}
          className="h-8 w-8"
          title="Sublinhado"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => wrapSelection('~~')}
          className="h-8 w-8"
          title="Taxado"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>
      </div>

      {/* Text Transform */}
      <div className="flex items-center border-r border-slate-200 pr-2 mr-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => transformText('upper')}
          className="h-8 px-2 text-xs"
          title="MAIÚSCULAS"
        >
          AA
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => transformText('lower')}
          className="h-8 px-2 text-xs"
          title="minúsculas"
        >
          aa
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => transformText('capitalize')}
          className="h-8 px-2 text-xs"
          title="Capitalizar"
        >
          Aa
        </Button>
      </div>

      {/* Image */}
      <div className="flex items-center border-r border-slate-200 pr-2 mr-1">
         <Button
           type="button"
           variant="ghost"
           size="icon"
           onClick={() => fileInputRef.current?.click()}
           className="h-8 w-8 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
           title="Adicionar Imagem"
         >
           <ImageIcon className="w-4 h-4" />
         </Button>
         <input 
           type="file" 
           ref={fileInputRef} 
           className="hidden" 
           accept="image/*" 
           onChange={onAddImage} 
         />
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
          className="h-8 w-8"
          title="Diminuir fonte"
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="text-xs font-medium w-8 text-center">{fontSize}px</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
          className="h-8 w-8"
          title="Aumentar fonte"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Emoji Picker */}
      <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Emojis"
          >
            <Smile className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="border-b p-2">
            <div className="flex gap-1 flex-wrap">
              {Object.keys(EMOJI_CATEGORIES).map(cat => (
                <Button
                  key={cat}
                  type="button"
                  variant={activeEmojiCategory === cat ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveEmojiCategory(cat)}
                  className="h-7 text-xs"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <div className="p-3 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
            {EMOJI_CATEGORIES[activeEmojiCategory].map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="text-xl hover:bg-slate-100 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick Emojis */}
      <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">
        {["🔥", "💯", "🚀", "💡", "✨"].map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => insertAtCursor(emoji)}
            className="text-lg hover:bg-slate-100 rounded p-1 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Clear */}
      <div className="ml-auto flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={clearText}
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          title="Limpar texto"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}