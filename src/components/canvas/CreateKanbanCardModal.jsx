import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CreateKanbanCardModal({ isOpen, onClose, focusId, initialContent = "" }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState(initialContent);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (isOpen) {
            setContent(initialContent);
            setTitle("");
        }
    }, [isOpen, initialContent]);

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Post.create(data),
        onSuccess: () => {
            toast.success("Card criado no Kanban!");
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            onClose();
            setTitle("");
            setContent(""); 
        },
        onError: () => toast.error("Erro ao criar card")
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("O título é obrigatório");
            return;
        }
        if (!focusId) {
            toast.error("Nenhum foco selecionado");
            return;
        }

        createMutation.mutate({
            focus_id: focusId,
            title: title,
            content: content,
            status: 'idea'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Criar Card no Kanban</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input 
                            id="title" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Ideia de post sobre..."
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Conteúdo</Label>
                        <Textarea 
                            id="content" 
                            value={content} 
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Descreva sua ideia..."
                            className="min-h-[150px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Criar Card
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}