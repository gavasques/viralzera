import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function CreateKanbanCardModal({ isOpen, onClose, initialTitle, initialContent, onConfirm, isPending }) {
    const [title, setTitle] = useState(initialTitle || "");
    const [content, setContent] = useState(initialContent || "");

    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle || "");
            setContent(initialContent || "");
        }
    }, [isOpen, initialTitle, initialContent]);

    const handleSubmit = () => {
        onConfirm({ title, content });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Criar Card no Kanban</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Título do card..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Conteúdo</Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Conteúdo do card..."
                            className="h-[300px] resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isPending || !title.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                        {isPending ? "Criando..." : "Criar Card"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}