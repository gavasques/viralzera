import React, { useState, useEffect } from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Loader2, Type, AlignLeft, Layout, Monitor, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateKanbanCardModal({ isOpen, onClose, initialTitle, initialContent, onConfirm, isPending, focusId }) {
    const [title, setTitle] = useState(initialTitle || "");
    const [content, setContent] = useState(initialContent || "");
    const [postTypeId, setPostTypeId] = useState("");
    const [platform, setPlatform] = useState("");
    const [notes, setNotes] = useState("");

    const { data: postTypes = [] } = useQuery({
        queryKey: ['post-types', focusId],
        queryFn: () => neon.entities.PostType.filter({ focus_id: focusId }),
        enabled: !!focusId
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

    const handleSubmit = () => {
        onConfirm({ title, content, postTypeId, platform, notes });
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
                        "sm:rounded-lg md:w-full sm:max-w-[700px] max-h-[90vh] overflow-y-auto custom-scrollbar"
                    )}
                >
                    <div className="flex flex-col space-y-1.5 text-center sm:text-left border-b pb-4">
                        <DialogPrimitive.Title className="text-xl font-bold leading-none tracking-tight text-slate-900">
                            Criar Card no Kanban
                        </DialogPrimitive.Title>
                        <p className="text-sm text-slate-500">
                            Preencha os detalhes para transformar esta ideia em um card.
                        </p>
                    </div>

                    <div className="grid gap-5 py-5">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="flex items-center gap-2 text-slate-700 font-medium">
                                <Type className="w-4 h-4 text-indigo-500" />
                                Título
                            </Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Título do card..."
                                className="h-11 border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-colors"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="content" className="flex items-center gap-2 text-slate-700 font-medium">
                                    <AlignLeft className="w-4 h-4 text-indigo-500" />
                                    Conteúdo
                                </Label>
                                <span className={cn("text-xs font-medium", content.length > 2200 ? "text-red-500" : "text-slate-400")}>
                                    {content.length.toLocaleString()} caracteres
                                </span>
                            </div>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Conteúdo do card..."
                                className="min-h-[200px] resize-none border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-colors leading-relaxed"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-slate-700 font-medium">
                                    <Layout className="w-4 h-4 text-indigo-500" />
                                    Tipo de Postagem
                                </Label>
                                <Select value={postTypeId} onValueChange={setPostTypeId}>
                                    <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50 focus:ring-indigo-500 focus:bg-white">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {postTypes.map(type => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-slate-700 font-medium">
                                    <Monitor className="w-4 h-4 text-indigo-500" />
                                    Plataforma
                                </Label>
                                <Select value={platform} onValueChange={setPlatform}>
                                    <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50 focus:ring-indigo-500 focus:bg-white">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Instagram">Instagram</SelectItem>
                                        <SelectItem value="TikTok">TikTok</SelectItem>
                                        <SelectItem value="YouTube">YouTube</SelectItem>
                                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                        <SelectItem value="Twitter">Twitter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="flex items-center gap-2 text-slate-700 font-medium">
                                <StickyNote className="w-4 h-4 text-indigo-500" />
                                Observações
                            </Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Instruções para a equipe, referências, links..."
                                className="min-h-[80px] resize-none border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-colors"
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