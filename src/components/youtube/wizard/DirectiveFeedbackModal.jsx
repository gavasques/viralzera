import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, X, Sparkles } from "lucide-react";

export default function DirectiveFeedbackModal({ open, onOpenChange, onConfirm, isLoading }) {
  const [feedback, setFeedback] = useState('');

  const handleConfirm = () => {
    onConfirm(feedback.trim());
    setFeedback('');
  };

  const handleCancel = () => {
    setFeedback('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            Ajustar Diretriz Criativa
          </DialogTitle>
          <DialogDescription>
            Descreva o que você gostaria de ajustar na diretriz. Deixe em branco para regenerar sem alterações.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="O que você gostaria de ajustar? Ex: Quero um tom mais agressivo, foque no medo de errar, destaque o método DAP..."
            className="min-h-[120px] resize-none"
            autoFocus
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Regenerando...' : 'Regenerar com Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}