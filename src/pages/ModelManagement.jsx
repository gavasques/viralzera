import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { fetchModels } from '@/components/chat/OpenRouterService';
import { toast } from 'sonner';
import { AdminProtection } from '@/components/admin/AdminProtection';
import AdminLayout from '@/components/admin/AdminLayout';
import PageHeader from '@/components/common/PageHeader';
import { Bot, Plus, Search, Check, X, GripVertical, Brain, Globe, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ApprovedModelCard from '@/components/admin/ApprovedModelCard';
import AddModelModal from '@/components/admin/AddModelModal';

export default function ModelManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  // Fetch all OpenRouter models
  const { data: allModels = [], isLoading: isLoadingModels, error: modelsError } = useQuery({
    queryKey: ['openrouterModels'],
    queryFn: async () => {
      console.log('[ModelManagement] Fetching models...');
      try {
        const models = await fetchModels();
        console.log('[ModelManagement] Loaded models:', models.length);
        return models;
      } catch (err) {
        console.error('[ModelManagement] Error fetching models:', err);
        throw err;
      }
    },
    staleTime: 300000,
    retry: 1
  });

  // Fetch approved models
  const { data: approvedModels = [], isLoading: isLoadingApproved } = useQuery({
    queryKey: ['approvedModels'],
    queryFn: () => base44.entities.ApprovedModel.list('order', 100),
    staleTime: 30000
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      await base44.entities.ApprovedModel.update(id, { is_active: isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvedModels'] });
      toast.success('Status atualizado');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.ApprovedModel.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvedModels'] });
      toast.success('Modelo removido');
    }
  });

  // Filter models by search (allow duplicates with different configs)
  const availableModels = allModels.filter(m => 
    (m.name.toLowerCase().includes(search.toLowerCase()) || 
     m.id.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddModel = (model) => {
    console.log('[ModelManagement] handleAddModel:', model);
    setSelectedModel(model);
    setAddModalOpen(true);
  };

  if (isLoadingModels || isLoadingApproved) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Gestão de Modelos" 
          subtitle="Configure quais modelos de IA estarão disponíveis para os usuários"
          icon={Bot}
        />
        <div className="grid gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <AdminProtection>
      <AdminLayout currentPage="ModelManagement">
        <div className="space-y-6 w-full">
      <PageHeader 
        title="Gestão de Modelos" 
        subtitle="Configure quais modelos de IA estarão disponíveis para os usuários"
        icon={Bot}
      />

      <Tabs defaultValue="approved" className="space-y-6" id="model-tabs">
        <TabsList>
          <TabsTrigger value="approved">
            Modelos Aprovados ({approvedModels.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Adicionar Novos
          </TabsTrigger>
        </TabsList>

        {/* Approved Models Tab */}
        <TabsContent value="approved" className="space-y-4">
          {approvedModels.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-medium text-slate-900 mb-2">Nenhum modelo aprovado</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Adicione modelos para que os usuários possam selecioná-los no Multi Chat e Gerador de Scripts.
                </p>
                <Button onClick={() => document.querySelector('[data-state="inactive"][value="available"]')?.click()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Modelos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {approvedModels.map(model => (
                <ApprovedModelCard
                  key={model.id}
                  model={model}
                  onToggleActive={(isActive) => toggleActiveMutation.mutate({ id: model.id, isActive })}
                  onEdit={() => { 
                    // Busca o modelo original do OpenRouter para ter os dados atualizados
                    const originalModel = allModels.find(m => m.id === model.model_id);
                    setSelectedModel({ ...model, _originalModel: originalModel }); 
                    setAddModalOpen(true); 
                  }}
                  onDelete={() => deleteMutation.mutate(model.id)}
                  isUpdating={toggleActiveMutation.isPending || deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Available Models Tab */}
        <TabsContent value="available" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar modelos (ex: gpt-4, claude, gemini)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {modelsError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-6 text-center text-red-700">
                <p className="font-medium">Erro ao carregar modelos</p>
                <p className="text-sm mt-1">{modelsError.message}</p>
              </CardContent>
            </Card>
          )}

          {!modelsError && allModels.length === 0 && !isLoadingModels && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-6 text-center text-amber-700">
                <p className="font-medium">Nenhum modelo encontrado</p>
                <p className="text-sm mt-1">Verifique se a API key do OpenRouter está configurada corretamente.</p>
              </CardContent>
            </Card>
          )}

          <ScrollArea className="h-[500px]">
            <div className="grid gap-2 pr-4">
              {availableModels.slice(0, 50).map(model => {
              return (
              <Card 
              key={model.id} 
              className="hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
              onClick={() => handleAddModel(model)}
              >
              <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-slate-900 truncate">{model.name}</span>
              {model.supportsReasoning && (
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
              <Brain className="w-3 h-3 mr-1" /> Reasoning
              </Badge>
              )}
              {model.supportsWebSearch && (
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
              <Globe className="w-3 h-3 mr-1" /> Web
              </Badge>
              )}
              {model.supportsToolCalling && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
              Tools
              </Badge>
              )}
              </div>
              <p className="text-xs text-slate-400 truncate">{model.id}</p>
              </div>
              <Button 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
              <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
              </CardContent>
              </Card>
              );
              })}
              
              {availableModels.length > 50 && (
                <p className="text-center text-sm text-slate-400 py-4">
                  Mostrando 50 de {availableModels.length} modelos. Use a busca para filtrar.
                </p>
              )}
              
              {availableModels.length === 0 && search && (
                <div className="text-center py-8 text-slate-500">
                  Nenhum modelo encontrado para "{search}"
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <AddModelModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        model={selectedModel}
        existingApproved={selectedModel?.model_id ? selectedModel : null}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['approvedModels'] });
          setAddModalOpen(false);
          setSelectedModel(null);
        }}
      />
        </div>
      </AdminLayout>
    </AdminProtection>
  );
}