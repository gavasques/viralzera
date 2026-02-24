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
  // Convert HTML to Markdown for clean export
  const getMarkdownText = () => {
    if (!content) return '';

    // Create temp element
    const div = document.createElement('div');
    div.innerHTML = content;

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const tagName = node.tagName.toLowerCase();
      let inner = '';
      
      // Handle children
      Array.from(node.childNodes).forEach(child => {
        inner += processNode(child);
      });

      switch (tagName) {
        case 'h1': return `# ${inner}\n\n`;
        case 'h2': return `## ${inner}\n\n`;
        case 'h3': return `### ${inner}\n\n`;
        case 'h4': return `#### ${inner}\n\n`;
        case 'h5': return `##### ${inner}\n\n`;
        case 'h6': return `###### ${inner}\n\n`;
        case 'p': return `${inner}\n\n`;
        case 'br': return '\n';
        case 'div': return `${inner}\n`;
        case 'strong':
        case 'b': return `**${inner}**`;
        case 'em':
        case 'i': return `*${inner}*`;
        case 'u': return inner; // Markdown doesn't standardly support underline
        case 'strike':
        case 's': return `~~${inner}~~`;
        case 'blockquote': return `> ${inner}\n\n`;
        case 'code': return `\`${inner}\``;
        case 'pre': return `\`\`\`\n${inner}\n\`\`\`\n\n`;
        case 'ul': return `${inner}\n`;
        case 'ol': return `${inner}\n`;
        case 'li': return `- ${inner}\n`;
        default: return inner;
      }
    }

    let markdown = '';
    Array.from(div.childNodes).forEach(node => {
      markdown += processNode(node);
    });

    // Clean up excessive newlines
    return markdown
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Copy script to clipboard
  const handleCopy = async () => {
    const text = getMarkdownText();
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Roteiro copiado (Markdown)');
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  // Download as TXT
  const handleDownloadTxt = () => {
    const text = getMarkdownText();
    const fileName = `${title || 'roteiro'}.txt`.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
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