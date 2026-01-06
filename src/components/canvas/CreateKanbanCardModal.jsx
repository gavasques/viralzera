import React, { useState, useEffect } from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function CreateKanbanCardModal({ isOpen, onClose, initialTitle, initialContent, onConfirm, isPending, focusId }) {
    const [title, setTitle] = useState(initialTitle || "");
    const [content, setContent] = useState(initialContent || "");
    const [postTypeId, setPostTypeId] = useState("");
    const [platform, setPlatform] = useState("");
    const [notes, setNotes] = useState("");

    // Fetch Post Types
    const { data: postTypes = [] } = useQuery({
        queryKey: ['postTypes', focusId],
        queryFn: () => base44.entities.PostType.filter({ focus_id: focusId, is_active: true }),
        enabled: !!focusId && isOpen
    });

    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle || "");
            setContent(initialContent || "");
            setPostTypeId("");
            setPlatform("");
            setNotes("");
        }
    }, [isOpen, initialTitle, initialContent]);

    // Auto-select platform when post type changes
    useEffect(() => {
        if (postTypeId && postTypes.length > 0) {
            const selectedType = postTypes.find(t => t.id === postTypeId);
            if (selectedType?.channel) {
                // Map PostType channel to Post platform if needed
                let mappedPlatform = selectedType.channel;
                if (mappedPlatform === 'Youtube') mappedPlatform = 'YouTube';
                if (mappedPlatform === 'X') mappedPlatform = 'Twitter';
                
                // Only set if it matches one of the valid Post platforms
                // Valid: ['Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'YouTube']
                const validPlatforms = ['Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'YouTube'];
                if (validPlatforms.includes(mappedPlatform)) {
                    setPlatform(mappedPlatform);
                }
            }
        }
    }, [postTypeId, postTypes]);

    const handleSubmit = () => {
        onConfirm({ 
            title, 
            content,
            postTypeId,
            platform,
            notes
        });
    };

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
            <DialogPrimitive.Portal>
                {/* Custom Overlay with reduced opacity (20% instead of default 80%) to keep sidebar visible */}
                <DialogPrimitive.Overlay 
                    className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
                />
                
                <DialogPrimitive.Content 
                    className={cn(
                        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
                        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
                        "sm:rounded-lg md:w-full sm:max-w-[600px]"
                    )}
                >
                    <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                        <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
                            Criar Card no Kanban
                        </DialogPrimitive.Title>
                    </div>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Título do card..."
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Conteúdo</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Conteúdo do card..."
                                className="h-[150px] resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo de Postagem</Label>
                                <Select value={postTypeId} onValueChange={setPostTypeId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {postTypes.map(type => (
                                            <SelectItem key={type.id} value={type.id}>{type.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Plataforma</Label>
                                <Select value={platform} onValueChange={setPlatform}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Instagram">Instagram</SelectItem>
                                        <SelectItem value="TikTok">TikTok</SelectItem>
                                        <SelectItem value="Twitter">Twitter (X)</SelectItem>
                                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                        <SelectItem value="YouTube">YouTube</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Instruções para a equipe, referências..."
                                className="h-[80px] resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={isPending || !title.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                "Criar Card"
                            )}
                        </Button>
                    </div>

                    <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}