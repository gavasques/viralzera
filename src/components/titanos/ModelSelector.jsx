import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ApprovedModelPicker from '@/components/common/ApprovedModelPicker';

export default function ModelSelector({ selectedModels, onSelectionChange }) {
    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto justify-between gap-4">
                    <span>
                        {selectedModels.length > 0 
                            ? `${selectedModels.length} modelos` 
                            : "Selecionar Modelos"}
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Selecionar Modelos</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-hidden">
                    <ApprovedModelPicker 
                        selectedModels={selectedModels} 
                        onSelectionChange={onSelectionChange} 
                        maxSelection={6}
                        category="chat"
                    />
                </div>
                
                <div className="pt-4 border-t flex justify-between items-center shrink-0">
                    <span className="text-sm text-slate-500">{selectedModels.length}/6 selecionados</span>
                    <Button onClick={() => setOpen(false)}>Concluir</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}