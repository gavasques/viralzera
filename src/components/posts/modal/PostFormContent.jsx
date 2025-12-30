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
            className="flex-1 min-h-[400px] font-mono text-sm resize-none p-4"
          />
        ) : (
          <div className="flex-1 min-h-[400px] border rounded-md p-6 bg-slate-50 overflow-y-auto">
            {form.content ? (
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {form.content}
              </div>
            ) : (
              <p className="text-slate-400 italic text-center py-10">
                Nenhum conteúdo ainda. Clique em editar para adicionar.
              </p>
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