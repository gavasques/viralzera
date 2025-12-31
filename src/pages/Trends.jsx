import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  Search, 
  Loader2, 
  BookmarkPlus,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import TrendResultCard from "@/components/trends/TrendResultCard";
import SavedTrendCard from "@/components/trends/SavedTrendCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFocusData } from "@/components/hooks/useFocusData";
import PageHeader from "@/components/common/PageHeader";
import InfoCard from "@/components/common/InfoCard";
import EmptyState from "@/components/common/EmptyState";
import { ListSkeleton } from "@/components/common/LoadingSkeleton";
import { searchTrends } from "@/components/trends/TrendsService";

export default function Trends() {
  const queryClient = useQueryClient();
  
  const [subject, setSubject] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  // Use custom hooks for data fetching
  const { data: savedTrends, isLoading: isLoadingTrends, selectedFocusId } = useFocusData('Trend', 'savedTrends', { limit: 50 });

  // Fetch trend config (global - único para todos os usuários)
  const { data: trendConfig } = useQuery({
    queryKey: ['trendConfig', 'global'],
    queryFn: async () => {
      const configs = await base44.entities.TrendConfig.list('-created_date', 1);
      return configs[0] || null;
    },
    staleTime: 1000 * 60 * 5 // 5 min cache
  });

  // Save trend mutation
  const saveTrendMutation = useMutation({
    mutationFn: (data) => base44.entities.Trend.create(data),
    onSuccess: () => {
      toast.success("Tendência salva!");
      queryClient.invalidateQueries({ queryKey: ['savedTrends'] });
    },
    onError: (err) => toast.error("Erro ao salvar: " + err.message)
  });

  // Delete trend mutation
  const deleteTrendMutation = useMutation({
    mutationFn: (id) => base44.entities.Trend.delete(id),
    onSuccess: () => {
      toast.success("Tendência removida");
      queryClient.invalidateQueries({ queryKey: ['savedTrends'] });
    }
  });

  const handleSearch = async () => {
    if (!subject.trim()) return toast.error("Digite um assunto");
    if (!trendConfig?.search_model) return toast.error("Configure o modelo de busca em Admin Zone > Configurações de Agentes");

    setIsSearching(true);
    setSearchResults(null);

    try {
      const prompt = (trendConfig.default_prompt || getDefaultPrompt())
        .replace("{ASSUNTO}", subject.trim())
        .replace("{PALAVRA_CHAVE}", keyword.trim() || subject.trim());

      const response = await base44.functions.invoke('openrouter', {
        action: 'chat',
        model: trendConfig.search_model,
        model_name: trendConfig.search_model_name,
        enableWebSearch: true,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        feature: 'trends_search'
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const message = response.data.choices?.[0]?.message;
      
      if (!message?.content) {
        throw new Error("Nenhum resultado retornado. Tente outro modelo ou refine sua busca.");
      }

      setSearchResults({
        content: message?.content || "",
        annotations: message?.annotations || [],
        subject: subject.trim(),
        keyword: keyword.trim()
      });

    } catch (error) {
      toast.error("Erro na pesquisa: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveTrend = (title, content, source) => {
    saveTrendMutation.mutate({
      focus_id: selectedFocusId,
      title,
      content,
      source_url: source?.url || "",
      source_title: source?.title || "",
      subject: searchResults?.subject || "",
      keyword: searchResults?.keyword || ""
    });
  };

  const getDefaultPrompt = () => `Pesquise as últimas tendências e notícias sobre: {ASSUNTO}
Foco especial em: {PALAVRA_CHAVE}

Por favor, forneça:
1. As principais tendências atuais
2. Notícias recentes relevantes
3. Insights importantes para criadores de conteúdo
4. Oportunidades de conteúdo baseadas nessas tendências

Seja específico e cite as fontes quando possível.`;

  const hasModel = !!trendConfig?.search_model;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tendências" 
        subtitle="Pesquise tendências e notícias com IA"
        icon={TrendingUp}
      />

      {!hasModel && (
        <InfoCard 
          icon={Sparkles}
          title="Modelo não configurado"
          description="Configure o modelo de busca em Admin Zone > Configurações de Agentes."
          variant="amber"
        />
      )}

      {/* Search Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Pesquisar Tendências</CardTitle>
          <CardDescription>Digite um assunto e palavra-chave para buscar tendências atuais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assunto</label>
              <Input
                placeholder="Ex: Marketing Digital, Moda, Tecnologia..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Palavra-chave (opcional)</label>
              <Input
                placeholder="Ex: Instagram Reels, IA, Sustentabilidade..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end">
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !hasModel}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200 gap-2"
            >
              {isSearching ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Pesquisando...</>
              ) : (
                <><Search className="w-4 h-4" /> Pesquisar</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Results / Saved */}
      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="saved">
            Salvos ({savedTrends?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          {isSearching ? (
            <ListSkeleton count={2} />
          ) : searchResults ? (
            <TrendResultCard 
              result={searchResults} 
              onSave={handleSaveTrend}
              isSaving={saveTrendMutation.isPending}
            />
          ) : (
            <EmptyState 
              icon={Search}
              description="Faça uma pesquisa para ver as tendências"
              className="border-dashed"
            />
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          {isLoadingTrends ? (
            <ListSkeleton count={2} />
          ) : savedTrends?.length > 0 ? (
            <div className="space-y-4">
              {savedTrends.map((trend) => (
                <SavedTrendCard 
                  key={trend.id} 
                  trend={trend}
                  onDelete={() => deleteTrendMutation.mutate(trend.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={BookmarkPlus}
              description="Nenhuma tendência salva ainda"
              className="border-dashed"
            />
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
}