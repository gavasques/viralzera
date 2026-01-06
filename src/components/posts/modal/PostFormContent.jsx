import React, { memo } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, PenLine } from "lucide-react";
import ReactQuill from 'react-quill';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

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
          className="bg-white"
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
          <div className="flex-1 flex flex-col min-h-[300px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden [&_.quill]:h-full [&_.quill]:flex [&_.quill]:flex-col [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 [&_.ql-toolbar]:bg-slate-50 [&_.ql-toolbar]:shrink-0 [&_.ql-container]:flex-1 [&_.ql-container]:overflow-hidden [&_.ql-container]:border-none [&_.ql-container]:font-sans [&_.ql-container]:text-base [&_.ql-editor]:h-full [&_.ql-editor]:overflow-y-auto">
            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={(value) => updateForm('content', value)}
              modules={modules}
              className="flex-1 flex flex-col"
              placeholder="Escreva o conteúdo da postagem..."
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-[300px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden [&_.quill]:h-full [&_.quill]:flex [&_.quill]:flex-col [&_.ql-container]:flex-1 [&_.ql-container]:overflow-hidden [&_.ql-container]:border-none [&_.ql-container]:font-sans [&_.ql-container]:text-base [&_.ql-editor]:h-full [&_.ql-editor]:overflow-y-auto">
            <ReactQuill
              value={form.content}
              readOnly={true}
              theme="snow"
              modules={{ toolbar: false }}
              className="flex-1 flex flex-col"
              placeholder="Nenhum conteúdo ainda."
            />
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
          className="min-h-[80px] bg-white"
        />
      </div>
    </div>
  );
}

export default memo(PostFormContent);