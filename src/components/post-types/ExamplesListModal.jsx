import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Trash2, Copy, Check, Plus, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function ExamplesListModal({ 
  isOpen, 
  onClose, 
  postType, 
  onDeleteExample,
  onAddExampleClick,
  onEditExample
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [exampleToDelete, setExampleToDelete] = useState(null);

  if (!postType) return null;

  const examples = postType.examples || [];
  
  const filteredExamples = examples.filter(ex => {
    const content = typeof ex === 'string' ? ex : ex.content;
    const comment = typeof ex === 'string' ? "" : ex.comment;
    const searchLower = searchTerm.toLowerCase();
    return content.toLowerCase().includes(searchLower) || comment.toLowerCase().includes(searchLower);
  });

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copiado!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start pr-8">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                Exemplos: {postType.title}
                <Badge variant="secondary">{examples.length}</Badge>
              </DialogTitle>
              <DialogDescription>
                Gerencie sua biblioteca de referências para este formato.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar nos exemplos..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => {
              onClose();
              onAddExampleClick(postType);
            }} 
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Novo
          </Button>
        </div>

        <ScrollArea className="flex-1 border rounded-md bg-slate-50 p-4">
          {filteredExamples.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <p>Nenhum exemplo encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExamples.map((ex, index) => {
                 // Find original index to delete correctly if filtered
                 const originalIndex = examples.indexOf(ex);
                 const content = typeof ex === 'string' ? ex : ex.content;
                 const comment = typeof ex === 'string' ? "" : ex.comment;

                 return (
                  <div key={index} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors group relative flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex flex-col gap-1.5 max-w-[75%]">
                             {(typeof ex !== 'string' && ex.source_type === 'mine') ? (
                                 <Badge variant="default" className="w-fit text-[10px] h-5 px-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200 shadow-none">Autoral</Badge>
                             ) : (
                                 <Badge variant="secondary" className="w-fit text-[10px] h-5 px-2 bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-none">Referência</Badge>
                             )}
                             
                             {comment && (
                                <div className="flex items-start gap-2 text-[10px] text-slate-500 bg-amber-50 px-2 py-1 rounded w-fit">
                                  <span className="font-semibold text-amber-700 shrink-0">Obs:</span> <span className="line-clamp-1">{comment}</span>
                                </div>
                             )}
                        </div>
                        
                        <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-400 hover:text-indigo-600"
                              onClick={() => onEditExample && onEditExample(postType, ex, originalIndex)}
                              title="Editar conteúdo"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                             <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopy(content, index)}
                              title="Copiar conteúdo"
                            >
                              {copiedIndex === index ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setExampleToDelete(originalIndex)}
                              title="Excluir exemplo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-50 p-3 rounded border border-slate-100 overflow-hidden">
                        <ScrollArea className="h-[200px] w-full pr-3">
                            <div className="font-mono text-[10px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                                {content}
                            </div>
                        </ScrollArea>
                    </div>
                  </div>
                 );
              })}
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>

        <ConfirmDialog
          open={exampleToDelete !== null}
          onOpenChange={(open) => !open && setExampleToDelete(null)}
          title="Excluir Exemplo"
          description="Tem certeza que deseja excluir este exemplo? Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={() => {
            if (exampleToDelete !== null) {
              onDeleteExample(postType, exampleToDelete);
              setExampleToDelete(null);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}