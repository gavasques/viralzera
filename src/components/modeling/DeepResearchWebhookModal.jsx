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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { neon } from "@/api/neonClient";
import { useQueryClient } from "@tanstack/react-query";

export default function DeepResearchWebhookModal({ open, onOpenChange, modelingId }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [searchDepth, setSearchDepth] = useState('basic');
  const [timeRange, setTimeRange] = useState('null');
  const [topic, setTopic] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Fetch the config to get the webhook URL
      const configs = await neon.entities.DeepResearchConfig.list();
      const config = configs?.[0];
      const webhookUrl = config?.config?.webhook_url;

      if (!webhookUrl) {
        throw new Error('URL do Webhook não configurada. Por favor, adicione a URL nas configurações do agente Deep Research.');
      }

      // Send directly from frontend as requested
      const payload = { 
        query: query.trim(),
        timestamp: new Date().toISOString(),
        search_depth: searchDepth,
        topic: topic,
        modeling_id: modelingId,
      };

      // Only add time_range if it's not 'null'
      if (timeRange !== 'null') {
        payload.time_range = timeRange;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro no webhook: ${response.status} - ${text}`);
      }

      // Tenta processar o retorno se houver
      try {
        const data = await response.json();
        
        // Pode vir como objeto ou array
        const result = Array.isArray(data) ? data[0] : data;

        if (result && result.output) {
          // Save as ModelingText instead of ModelingResearch
          const content = result.output;
          const charCount = content.length;
          const tokenEstimate = Math.ceil(charCount / 4);

          const newText = await neon.entities.ModelingText.create({
            modeling_id: modelingId,
            title: `Pesquisa: ${query.trim()}`,
            description: `Depth: ${searchDepth}, Topic: ${topic}, Range: ${timeRange !== 'null' ? timeRange : 'all'}`,
            content: content,
            text_type: 'research',
            character_count: charCount,
            token_estimate: tokenEstimate
          });

          // Update modeling totals
          const allTexts = await neon.entities.ModelingText.filter({ modeling_id: modelingId });
          const allVideos = await neon.entities.ModelingVideo.filter({ modeling_id: modelingId });

          const textChars = allTexts.reduce((sum, t) => sum + (t.character_count || 0), 0);
          const textTokens = allTexts.reduce((sum, t) => sum + (t.token_estimate || 0), 0);
          const videoChars = allVideos.reduce((sum, v) => sum + (v.character_count || 0), 0);
          const videoTokens = allVideos.reduce((sum, v) => sum + (v.token_estimate || 0), 0);

          await neon.entities.Modeling.update(modelingId, {
            total_characters: textChars + videoChars,
            total_tokens_estimate: textTokens + videoTokens
          });

          // Invalidate queries first to show the saved item immediately
          queryClient.invalidateQueries({ queryKey: ['modelingTexts', modelingId] });
          queryClient.invalidateQueries({ queryKey: ['modelings'] });
          toast.success('Pesquisa salva em Textos com sucesso!');

          // Run analysis safely
          if (neon.functions?.invoke) {
            neon.functions.invoke('runModelingAnalysis', {
              modeling_id: modelingId,
              materialId: newText.id,
              materialType: 'text',
              content: content
            }).catch(err => {
              console.error('Erro ao analisar pesquisa:', err);
            });
          } else {
            console.warn('Função de análise indisponível no momento');
          }
        } else {
          toast.success('Pesquisa enviada! Aguardando retorno via webhook...');
        }
      } catch (e) {
        // Se falhar o parse do JSON mas o status for OK, assume que foi sucesso e o webhook pode retornar depois
        console.log("Resposta sem JSON ou erro ao processar:", e);
        toast.success('Pesquisa enviada com sucesso!');
      }
      
      onOpenChange(false);
      setQuery('');
      // Reset defaults
      setSearchDepth('basic');
      setTimeRange('null');
      setTopic('general');
    } catch (error) {
      console.error('Erro ao enviar pesquisa:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Pesquisa Profunda
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">
              O que você quer procurar?
            </label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Descreva detalhadamente o que você precisa pesquisar..."
              className="min-h-[100px] resize-none"
              autoFocus
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Settings2 className="w-4 h-4" />
              <span className="text-sm font-medium">Configurações Avançadas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search Depth */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Profundidade</label>
                <Select value={searchDepth} onValueChange={setSearchDepth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ultra-fast">Ultra-Fast (Instantâneo)</SelectItem>
                    <SelectItem value="fast">Fast (Rápido)</SelectItem>
                    <SelectItem value="basic">Basic (Padrão)</SelectItem>
                    <SelectItem value="advanced">Advanced (Detalhado - 2 créditos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Range */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Período</label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Sem filtro</SelectItem>
                    <SelectItem value="day">Últimas 24h</SelectItem>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                    <SelectItem value="year">Último ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Topic */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Tópico</label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="news">Notícias</SelectItem>
                    <SelectItem value="finance">Finanças</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
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