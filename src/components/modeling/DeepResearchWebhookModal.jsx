import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function DeepResearchWebhookModal({ open, onOpenChange }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Fetch the config to get the webhook URL
      const configs = await base44.entities.DeepResearchConfig.list();
      const config = configs?.[0];
      const webhookUrl = config?.webhook_url;

      if (!webhookUrl) {
        throw new Error('URL do Webhook não configurada. Por favor, adicione a URL nas configurações do agente Deep Research.');
      }

      // Send directly from frontend as requested
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: query.trim(),
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro no webhook: ${response.status} - ${text}`);
      }
      
      onOpenChange(false);
      setQuery('');
      toast.success('Pesquisa enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar pesquisa:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Pesquisa Profunda
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            O que você quer procurar?
          </label>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Descreva detalhadamente o que você precisa pesquisar..."
            className="min-h-[120px] resize-none"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Pesquisa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}