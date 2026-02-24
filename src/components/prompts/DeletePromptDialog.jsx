import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';

export default function DeletePromptDialog({ open, onOpenChange, prompt, onConfirm, isDeleting }) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Prompt</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir o prompt "{prompt?.title}"? 
                        Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}