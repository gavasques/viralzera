import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Edit3, 
  ArrowUpRight, 
  Copy, 
  Check, 
  FolderOpen, 
  Sparkles,
  Type,
  PanelRightOpen,
  PanelRightClose
} from "lucide-react";
import EmojiPickerPopover from "../EmojiPickerPopover";

export default function CanvasEditorToolbar({
  isEditMode,
  editedTitle,
  setEditedTitle,
  editedFolderId,
  setEditedFolderId,
  folders,
  currentFolder,
  editedContent,
  setIsEditMode,
  handleInsertEmoji,
  showRightPanel,
  setShowRightPanel,
  onSendToKanban,
  handleCopy,
  copied
}) {
  const charCount = editedContent?.length || 0;
  
  return (
    <div className="flex-shrink-0 bg-white border-b border-slate-200/80">
      {/* Title Row */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center gap-4">
          {isEditMode ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Título do canvas..."
              className="flex-1 text-2xl font-bold border-0 border-b-2 border-transparent focus:border-indigo-500 rounded-none px-0 h-auto py-1 focus-visible:ring-0 bg-transparent placeholder:text-slate-300"
            />
          ) : (
            <h1 className="flex-1 text-2xl font-bold text-slate-900 truncate">
              {editedTitle || "Sem título"}
            </h1>
          )}
          
          {/* Folder Badge/Select */}
          {isEditMode ? (
            <Select value={editedFolderId} onValueChange={setEditedFolderId}>
              <SelectTrigger className="w-[160px] h-9 text-sm border-slate-200 bg-slate-50 hover:bg-slate-100">
                <FolderOpen className="w-3.5 h-3.5 mr-2 text-slate-400" />
                <SelectValue placeholder="Pasta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem Pasta</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : currentFolder && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
              <FolderOpen className="w-3.5 h-3.5" />
              {currentFolder.name}
            </div>
          )}
        </div>
      </div>

      {/* Actions Row */}
      <div className="px-6 pb-3 flex items-center justify-between gap-4">
        {/* Left: Character count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-semibold">
            <Type className="w-3 h-3" />
            {charCount.toLocaleString()}
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-1">
          {isEditMode && (
            <EmojiPickerPopover onEmojiSelect={handleInsertEmoji} />
          )}

          {!isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditMode(true)}
              className="h-8 px-3 gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar
            </Button>
          )}

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRightPanel(!showRightPanel)}
            className={`h-8 px-3 gap-1.5 text-xs font-medium transition-all ${
              showRightPanel 
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {showRightPanel ? (
              <PanelRightClose className="w-3.5 h-3.5" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5" />
            )}
            <Sparkles className="w-3.5 h-3.5" />
            IA
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSendToKanban({ title: editedTitle, content: editedContent })}
            className="h-8 px-3 gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Kanban
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            Copiar
          </Button>
        </div>
      </div>
    </div>
  );
}