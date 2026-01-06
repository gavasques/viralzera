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
          <div className="flex-1 flex flex-col min-h-[400px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden [&_.quill]:flex-1 [&_.quill]:flex [&_.quill]:flex-col [&_.ql-container]:flex-1 [&_.ql-container]:overflow-y-auto [&_.ql-container]:font-sans [&_.ql-container]:text-base [&_.ql-editor]:h-full [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-none">
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
          <div className="flex-1 min-h-[400px] p-8 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
            {form.content ? (
              <div 
                className="text-slate-700 leading-relaxed max-w-3xl mx-auto whitespace-pre-wrap break-words [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1 [&_strong]:font-bold [&_br]:h-4 [&_br]:block"
                dangerouslySetInnerHTML={{ __html: form.content }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 italic min-h-[200px]">
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
          className="min-h-[80px] bg-white"
        />
      </div>
    </div>
  );
}

export default memo(PostFormContent);