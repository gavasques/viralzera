import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Download, 
  Copy, 
  StickyNote, 
  EyeOff, 
  Eye,
  FileText
} from "lucide-react";
import { toast } from "sonner";

export default function ScriptActionsDropdown({ 
  content, 
  title,
  notesVisible,
  onToggleNotes 
}) {
  // Strip HTML tags for plain text export
  const getPlainText = () => {
    const tmp = document.createElement('div');
    tmp.innerHTML = content || '';
    return tmp.textContent || tmp.innerText || '';
  };

  // Copy script to clipboard
  const handleCopy = async () => {
    const plainText = getPlainText();
    try {
      await navigator.clipboard.writeText(plainText);
      toast.success('Roteiro copiado para a área de transferência');
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  // Download as TXT
  const handleDownloadTxt = () => {
    const plainText = getPlainText();
    const fileName = `${title || 'roteiro'}.txt`.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
    
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Roteiro baixado como TXT');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          Copiar Roteiro
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleDownloadTxt} className="cursor-pointer">
          <Download className="w-4 h-4 mr-2" />
          Baixar como TXT
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onToggleNotes} className="cursor-pointer">
          {notesVisible ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Ocultar Notas
            </>
          ) : (
            <>
              <StickyNote className="w-4 h-4 mr-2" />
              Exibir Notas
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}