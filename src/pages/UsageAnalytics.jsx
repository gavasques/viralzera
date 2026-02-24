import React, { useState, useMemo } from 'react';
import { neon } from "@/api/neonClient";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminProtection } from '@/components/admin/AdminProtection';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Users, 
  Zap, 
  Calendar, 
  Search,
  Download,
  Filter,
  Activity,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Trophy,
  Bot
} from "lucide-react";

// Components
import StatsCardsGrid from '@/components/analytics/StatsCardsGrid';
import DailyUsageChart from '@/components/analytics/DailyUsageChart';
import FeaturesPieChart from '@/components/analytics/FeaturesPieChart';
import TopModelsChart from '@/components/analytics/TopModelsChart';
import UserConsumptionList from '@/components/analytics/UserConsumptionList';
import FeatureBreakdownList from '@/components/analytics/FeatureBreakdownList';
import DetailedLogsTable from '@/components/analytics/DetailedLogsTable';
import VotesSection from '@/components/analytics/VotesSection';

const FEATURE_LABELS = {
  audience_chat: 'Chat Público-Alvo',
  persona_chat: 'Chat Persona',
  product_chat: 'Chat Produto',
  script_chat: 'Gerador de Scripts',
  trends_search: 'Pesquisa Tendências',
  dna_transcribe: 'DNA Transcrição',
  dna_analyze: 'DNA Análise',
  dna_generate: 'DNA Geração',
  titanos_chat: 'Multi Chat',
  pdf_import: 'Importar PDF',
  openrouter_chat: 'OpenRouter Chat',
  refine_prompt: 'Refinar Prompt',
  ocr_post_type: 'OCR (Tipos de Post)',
  video_transcription: 'Transcrição Vídeo',
  image_generation: 'Geração de Imagem',
  other: 'Outros'
};

export default function UsageAnalytics() {
  const [dateRange, setDateRange] = useState('7');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all usage logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['usageLogs', dateRange],
    queryFn: async () => {
      const allLogs = await neon.entities.UsageLog.list('-created_date', 2000);
      const days = parseInt(dateRange);
      const since = subDays(new Date(), days);
      return allLogs.filter(log => new Date(log.created_date) >= since);
    },
    staleTime: 60000,
    refetchInterval: 300000
  });

  // Fetch all votes
  const { data: allVotes = [] } = useQuery({
    queryKey: ['modelVotesAdmin', dateRange],
    queryFn: async () => {
      const allVotes = await neon.entities.ModelVote.list('-created_date', 1000);
      const days = parseInt(dateRange);
      const since = subDays(new Date(), days);
      return allVotes.filter(vote => new Date(vote.created_date) >= since);
    },
  });

  // Vote rankings
  const voteRankings = useMemo(() => {
    const modelVotes = {};
    allVotes.forEach(vote => {
      if (vote.vote_type === 'best') {
        const key = vote.model_id;
        if (!modelVotes[key]) {
          modelVotes[key] = {
            model_id: vote.model_id,
            model_alias: vote.model_alias || vote.model_id.split('/')[1] || vote.model_id,
            votes: 0,
            conversations: new Set(),
            users: new Set()
          };
        }
        modelVotes[key].votes += 1;
        modelVotes[key].conversations.add(vote.conversation_id);
        modelVotes[key].users.add(vote.created_by);
      }
    });
    return Object.values(modelVotes)
      .map(m => ({
        ...m,
        unique_conversations: m.conversations.size,
        unique_users: m.users.size,
        conversations: undefined,
        users: undefined
      }))
      .sort((a, b) => b.votes - a.votes);
  }, [allVotes]);

  // Get unique users
  const users = useMemo(() => {
    return [...new Set(logs.map(l => l.user_email))].sort();
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchUser = selectedUser === 'all' || log.user_email === selectedUser;
      const matchFeature = selectedFeature === 'all' || log.feature === selectedFeature;
      const matchSearch = !searchTerm || 
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.model?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchUser && matchFeature && matchSearch;
    });
  }, [logs, selectedUser, selectedFeature, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalTokens = filteredLogs.reduce((sum, l) => sum + (l.total_tokens || 0), 0);
    const promptTokens = filteredLogs.reduce((sum, l) => sum + (l.prompt_tokens || 0), 0);
    const completionTokens = filteredLogs.reduce((sum, l) => sum + (l.completion_tokens || 0), 0);
    const reasoningTokens = filteredLogs.reduce((sum, l) => sum + (l.reasoning_tokens || 0), 0);
    const totalCalls = filteredLogs.length;
    const successfulCalls = filteredLogs.filter(l => l.success !== false).length;
    const failedCalls = totalCalls - successfulCalls;
    const avgDuration = filteredLogs.length > 0 
      ? Math.round(filteredLogs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / filteredLogs.length)
      : 0;
    const uniqueUsers = new Set(filteredLogs.map(l => l.user_email)).size;
    const estimatedCost = (promptTokens * 0.000001) + (completionTokens * 0.000002) + (reasoningTokens * 0.000003);

    return { totalTokens, promptTokens, completionTokens, reasoningTokens, totalCalls, successfulCalls, failedCalls, avgDuration, uniqueUsers, estimatedCost };
  }, [filteredLogs]);

  // Usage by feature
  const usageByFeature = useMemo(() => {
    const byFeature = {};
    filteredLogs.forEach(log => {
      const feature = log.feature || 'other';
      if (!byFeature[feature]) byFeature[feature] = { tokens: 0, calls: 0 };
      byFeature[feature].tokens += log.total_tokens || 0;
      byFeature[feature].calls += 1;
    });
    return Object.entries(byFeature)
      .map(([feature, data]) => ({
        name: FEATURE_LABELS[feature] || feature,
        feature,
        tokens: data.tokens,
        calls: data.calls
      }))
      .sort((a, b) => b.tokens - a.tokens);
  }, [filteredLogs]);

  // Usage by user
  const usageByUser = useMemo(() => {
    const byUser = {};
    filteredLogs.forEach(log => {
      const email = log.user_email || 'unknown';
      if (!byUser[email]) {
        byUser[email] = { 
          tokens: 0, calls: 0, features: new Set(),
          promptTokens: 0, completionTokens: 0, reasoningTokens: 0, estimatedCost: 0
        };
      }
      byUser[email].tokens += log.total_tokens || 0;
      byUser[email].promptTokens += log.prompt_tokens || 0;
      byUser[email].completionTokens += log.completion_tokens || 0;
      byUser[email].reasoningTokens += log.reasoning_tokens || 0;
      byUser[email].calls += 1;
      byUser[email].features.add(log.feature);
      byUser[email].estimatedCost += ((log.prompt_tokens || 0) * 0.000001) + 
                                      ((log.completion_tokens || 0) * 0.000002) + 
                                      ((log.reasoning_tokens || 0) * 0.000003);
    });
    return Object.entries(byUser)
      .map(([email, data]) => ({
        email,
        tokens: data.tokens,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        reasoningTokens: data.reasoningTokens,
        calls: data.calls,
        featuresCount: data.features.size,
        estimatedCost: data.estimatedCost
      }))
      .sort((a, b) => b.tokens - a.tokens);
  }, [filteredLogs]);

  // Daily usage
  const dailyUsage = useMemo(() => {
    const byDay = {};
    filteredLogs.forEach(log => {
      const day = format(parseISO(log.created_date), 'yyyy-MM-dd');
      if (!byDay[day]) byDay[day] = { tokens: 0, calls: 0 };
      byDay[day].tokens += log.total_tokens || 0;
      byDay[day].calls += 1;
    });
    return Object.entries(byDay)
      .map(([date, data]) => ({
        date,
        displayDate: format(parseISO(date), 'dd/MM', { locale: ptBR }),
        tokens: data.tokens,
        calls: data.calls
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredLogs]);

  // Usage by model
  const usageByModel = useMemo(() => {
    const byModel = {};
    filteredLogs.forEach(log => {
      const model = log.model || 'unknown';
      if (!byModel[model]) byModel[model] = { tokens: 0, calls: 0, promptTokens: 0, completionTokens: 0, reasoningTokens: 0 };
      byModel[model].tokens += log.total_tokens || 0;
      byModel[model].promptTokens += log.prompt_tokens || 0;
      byModel[model].completionTokens += log.completion_tokens || 0;
      byModel[model].reasoningTokens += log.reasoning_tokens || 0;
      byModel[model].calls += 1;
    });
    return Object.entries(byModel)
      .map(([model, data]) => ({
        model,
        shortName: model.split('/').pop() || model,
        tokens: data.tokens,
        calls: data.calls,
        estimatedCost: (data.promptTokens * 0.000001) + (data.completionTokens * 0.000002) + (data.reasoningTokens * 0.000003)
      }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10);
  }, [filteredLogs]);

  // Top models by cost
  const topModelsByCost = useMemo(() => {
    return [...usageByModel].sort((a, b) => b.estimatedCost - a.estimatedCost).slice(0, 5);
  }, [usageByModel]);

  const exportCSV = () => {
    const headers = ['Data', 'Usuário', 'Feature', 'Modelo', 'Tokens Prompt', 'Tokens Resposta', 'Total Tokens', 'Duração (ms)', 'Sucesso'];
    const rows = filteredLogs.map(log => [
      format(parseISO(log.created_date), 'dd/MM/yyyy HH:mm'),
      log.user_email,
      FEATURE_LABELS[log.feature] || log.feature,
      log.model,
      log.prompt_tokens || 0,
      log.completion_tokens || 0,
      log.total_tokens || 0,
      log.duration_ms || 0,
      log.success !== false ? 'Sim' : 'Não'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 rounded-lg w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
          </div>
          <div className="h-80 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <AdminProtection>
      <AdminLayout currentPage="UsageAnalytics">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-2.5 rounded-xl shadow-lg shadow-pink-200">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Análise de Consumo</h1>
              <p className="text-xs text-slate-500">Monitore tokens e créditos por usuário e funcionalidade</p>
            </div>
          </div>
          <Button onClick={exportCSV} variant="outline" className="gap-2 rounded-xl">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Último dia</SelectItem>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="14">Últimos 14 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-48 rounded-xl border-slate-200">
                    <SelectValue placeholder="Todos usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos usuários</SelectItem>
                    {users.map(email => (
                      <SelectItem key={email} value={email}>{email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={selectedFeature} onValueChange={setSelectedFeature}>
                  <SelectTrigger className="w-48 rounded-xl border-slate-200">
                    <SelectValue placeholder="Todas features" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas features</SelectItem>
                    {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por usuário ou modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <StatsCardsGrid stats={stats} topModelsByCost={topModelsByCost} />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Por Usuário
            </TabsTrigger>
            <TabsTrigger value="features" className="rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Por Feature
            </TabsTrigger>
            <TabsTrigger value="votes" className="rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              Votos
            </TabsTrigger>
            <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Logs Detalhados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DailyUsageChart data={dailyUsage} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FeaturesPieChart data={usageByFeature} />
              <TopModelsChart data={usageByModel} />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserConsumptionList data={usageByUser} />
          </TabsContent>

          <TabsContent value="features">
            <FeatureBreakdownList data={usageByFeature} />
          </TabsContent>

          <TabsContent value="votes">
            <VotesSection votes={allVotes} rankings={voteRankings} />
          </TabsContent>

          <TabsContent value="logs">
            <DetailedLogsTable logs={filteredLogs} />
          </TabsContent>
        </Tabs>
      </div>
      </AdminLayout>
    </AdminProtection>
  );
}