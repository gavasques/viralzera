import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AdminProtection } from '@/components/admin/AdminProtection';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Search, 
  Loader2, 
  Brain, 
  Globe, 
  Wrench, 
  Eye, 
  Copy, 
  Check,
  Cpu,
  DollarSign
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PageHeader from "@/components/common/PageHeader";

export default function OpenRouterModels() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const { data: models = [], isLoading, error } = useQuery({
    queryKey: ['openrouter-models-full'],
    queryFn: async () => {
      console.log('[OpenRouterModels] Fetching models...');
      try {
        const response = await base44.functions.invoke('openrouter', { action: 'listModels' });
        console.log('[OpenRouterModels] Response:', response);
        return response.data?.models || [];
      } catch (err) {
        console.error('[OpenRouterModels] Error:', err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const filteredModels = models.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatPrice = (val) => {
    if (!val || val === "0") return "Grátis";
    // OpenRouter prices are usually per 1M tokens, but sometimes represented directly
    // Usually pricing is string like "0.000001" (per token) or similar.
    // Let's assume the value coming from API is numeric string per token.
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return `$${(num * 1000000).toFixed(2)} / 1M`;
  };

  return (
    <AdminProtection>
      <AdminLayout currentPage="OpenRouterModels">
        <div className="space-y-6 w-full">
      <PageHeader 
        title="Modelos OpenRouter" 
        subtitle="Explorador completo de modelos disponíveis na API"
        icon={Cpu}
      />

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar por nome ou ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-slate-500">
          {filteredModels.length} modelos encontrados
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[300px]">Modelo</TableHead>
                <TableHead>Contexto</TableHead>
                <TableHead>Input (1M)</TableHead>
                <TableHead>Output (1M)</TableHead>
                <TableHead>Recursos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.slice(0, 50).map((model) => (
                <TableRow key={model.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{model.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                          {model.id}
                        </code>
                        <button 
                          onClick={() => handleCopy(model.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {copiedId === model.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {parseInt(model.context_length).toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {formatPrice(model.pricing?.prompt)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {formatPrice(model.pricing?.completion)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {model.id.toLowerCase().includes('vision') && (
                        <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 px-1.5 h-5">
                          <Eye className="w-3 h-3 mr-1" /> Visão
                        </Badge>
                      )}
                      {(model.supports_tool_calling || model.supported_parameters?.includes('tools')) && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 px-1.5 h-5">
                          <Wrench className="w-3 h-3 mr-1" /> Tools
                        </Badge>
                      )}
                      {(model.id.toLowerCase().includes('reasoning') || model.supported_parameters?.includes('include_reasoning')) && (
                        <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 px-1.5 h-5">
                          <Brain className="w-3 h-3 mr-1" /> Reasoning
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedModel(model)}>
                          Detalhes
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
                        <SheetHeader className="mb-6">
                          <SheetTitle className="text-xl">{model.name}</SheetTitle>
                          <SheetDescription className="flex items-center gap-2">
                             {model.id}
                             <button onClick={() => handleCopy(model.id)}>
                               {copiedId === model.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                             </button>
                          </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-6">
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              <DollarSign className="w-4 h-4" /> Preços
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-xs text-slate-500 block">Input (Prompt)</span>
                                <span className="font-mono text-sm">{formatPrice(model.pricing?.prompt)}</span>
                              </div>
                              <div>
                                <span className="text-xs text-slate-500 block">Output (Completion)</span>
                                <span className="font-mono text-sm">{formatPrice(model.pricing?.completion)}</span>
                              </div>
                              {model.pricing?.request && model.pricing.request !== "0" && (
                                <div>
                                  <span className="text-xs text-slate-500 block">Por Requisição</span>
                                  <span className="font-mono text-sm">${model.pricing.request}</span>
                                </div>
                              )}
                              {model.pricing?.image && model.pricing.image !== "0" && (
                                <div>
                                  <span className="text-xs text-slate-500 block">Por Imagem</span>
                                  <span className="font-mono text-sm">${model.pricing.image}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-semibold text-sm">Descrição</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {model.description || "Sem descrição disponível."}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-semibold text-sm">Arquitetura & Configuração</h3>
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                              <div className="text-slate-500">Context Length</div>
                              <div className="font-mono">{parseInt(model.context_length).toLocaleString()}</div>
                              
                              <div className="text-slate-500">Architecture</div>
                              <div>{model.architecture?.modality || '-'} / {model.architecture?.tokenizer || '-'}</div>

                              <div className="text-slate-500">Top Provider</div>
                              <div>{model.top_provider?.context_length ? `${model.top_provider.max_completion_tokens || '?'} tokens` : '-'}</div>
                            </div>
                          </div>

                          {model.supported_parameters && (
                             <div className="space-y-2">
                               <h3 className="font-semibold text-sm">Parâmetros Suportados</h3>
                               <div className="flex flex-wrap gap-1.5">
                                 {model.supported_parameters.map(param => (
                                   <Badge key={param} variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
                                     {param}
                                   </Badge>
                                 ))}
                               </div>
                             </div>
                          )}

                          <div className="space-y-2">
                            <h3 className="font-semibold text-sm">JSON Bruto</h3>
                            <div className="bg-slate-950 text-slate-50 p-3 rounded-lg overflow-x-auto">
                              <pre className="text-[10px] font-mono">
                                {JSON.stringify(model, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
        {!isLoading && filteredModels.length === 0 && (
           <div className="p-8 text-center text-slate-500">
             Nenhum modelo encontrado para "{searchTerm}"
           </div>
        )}
      </div>
        </div>
      </AdminLayout>
    </AdminProtection>
  );
}