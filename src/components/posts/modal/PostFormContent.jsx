import React, { memo } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, PenLine } from "lucide-react";

function PostFormContent({ 
  form, 
  updateForm, 
  isEditingContent, 
  setIsEditingContent 
}) {
  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      {/* Title */}
      <div className="space-y-2">
        <Label>Título / Resumo</Label>
        <Input
          placeholder="Ex: Post sobre produtividade para CLTs"
          value={form.title}
          onChange={(e) => updateForm('title', e.target.value)}
        />
      </div>

      {/* Content */}
      <div className="space-y-2 flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center">
          <Label>Conteúdo / Script</Label>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditingContent(!isEditingContent)}
            className="h-8 text-xs gap-1.5"
          >
            {isEditingContent ? (
              <>
                <FileText className="w-3 h-3" />
                Visualizar
              </>
            ) : (
              <>
                <PenLine className="w-3 h-3" />
                Editar Conteúdo
              </>
            )}
          </Button>
        </div>
        
        {isEditingContent ? (
          <Textarea
            placeholder="Cole aqui o script gerado ou escreva o conteúdo da postagem..."
            value={form.content}
            onChange={(e) => updateForm('content', e.target.value)}
            className="flex-1 min-h-[400px] font-mono text-sm resize-none p-4 focus-visible:ring-0 border-slate-200"
          />
        ) : (
          <div className="flex-1 min-h-[400px] p-1 overflow-y-auto">
            {form.content ? (
              <div 
                className="text-slate-700 leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1 [&_strong]:font-bold [&_br]:h-4 [&_br]:block"
                dangerouslySetInnerHTML={{ __html: form.content }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 italic min-h-[200px] bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                <p>Nenhum conteúdo ainda.</p>
                <p className="text-sm">Clique em "Editar Conteúdo" para começar.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          placeholder="Anotações, ideias, referências..."
          value={form.notes}
          onChange={(e) => updateForm('notes', e.target.value)}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}

export default memo(PostFormContent);