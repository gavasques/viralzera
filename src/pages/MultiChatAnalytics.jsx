import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { AdminProtection } from '@/components/admin/AdminProtection';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
    BarChart3, Bot, Coins, Hash, Clock, TrendingUp, Calendar,
    ArrowUpRight, ArrowDownRight, Sparkles, Trophy, ThumbsUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#3b82f6', '#f59e0b'];

export default function MultiChatAnalytics() {
    const [period, setPeriod] = useState('30');

    // Fetch all conversations
    const { data: conversations = [] } = useQuery({
        queryKey: ['titanosConversations'],
        queryFn: () => base44.entities.TitanosConversation.list('-created_date', 500),
    });

    // Fetch all messages
    const { data: allMessages = [] } = useQuery({
        queryKey: ['allTitanosMessages'],
        queryFn: async () => {
            const msgs = await base44.entities.TitanosMessage.list('-created_date', 5000);
            return msgs;
        },
    });

    // Fetch all votes
    const { data: allVotes = [] } = useQuery({
        queryKey: ['modelVotes'],
        queryFn: () => base44.entities.ModelVote.list('-created_date', 1000),
    });

    // Calculate date range
    const dateRange = useMemo(() => {
        const days = parseInt(period);
        return {
            start: startOfDay(subDays(new Date(), days)),
            end: endOfDay(new Date())
        };
    }, [period]);

    // Filter data by period
    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            const date = new Date(c.created_date);
            return isWithinInterval(date, dateRange);
        });
    }, [conversations, dateRange]);

    const filteredMessages = useMemo(() => {
        return allMessages.filter(m => {
            const date = new Date(m.created_date);
            return isWithinInterval(date, dateRange);
        });
    }, [allMessages, dateRange]);

    const filteredVotes = useMemo(() => {
        return allVotes.filter(v => {
            const date = new Date(v.created_date);
            return isWithinInterval(date, dateRange);
        });
    }, [allVotes, dateRange]);

    // Calculate vote rankings
    const voteRankings = useMemo(() => {
        const modelVotes = {};
        
        filteredVotes.forEach(vote => {
            if (vote.vote_type === 'best') {
                const key = vote.model_id;
                if (!modelVotes[key]) {
                    modelVotes[key] = {
                        model_id: vote.model_id,
                        model_alias: vote.model_alias || vote.model_id.split('/')[1] || vote.model_id,
                        votes: 0,
                        conversations: new Set()
                    };
                }
                modelVotes[key].votes += 1;
                modelVotes[key].conversations.add(vote.conversation_id);
            }
        });

        return Object.values(modelVotes)
            .map(m => ({
                ...m,
                unique_conversations: m.conversations.size,
                conversations: undefined
            }))
            .sort((a, b) => b.votes - a.votes);
    }, [filteredVotes]);

    // Calculate metrics
    const metrics = useMemo(() => {
        let totalTokens = 0;
        let totalCost = 0;
        let totalDuration = 0;
        let responseCount = 0;
        const modelUsage = {};
        const dailyStats = {};

        filteredMessages.forEach(msg => {
            if (msg.role === 'assistant' && msg.metrics) {
                const usage = msg.metrics.usage || {};
                const tokens = usage.total_tokens || (usage.prompt_tokens || 0) + (usage.completion_tokens || 0) || 0;
                totalTokens += tokens;
                totalDuration += (msg.metrics.duration || 0);
                responseCount++;

                // Estimate cost
                const promptTokens = usage.prompt_tokens || 0;
                const completionTokens = usage.completion_tokens || 0;
                const cost = (promptTokens * 0.000001) + (completionTokens * 0.000002);
                totalCost += cost;

                // Model usage tracking
                if (msg.model_id) {
                    if (!modelUsage[msg.model_id]) {
                        modelUsage[msg.model_id] = { tokens: 0, cost: 0, responses: 0, duration: 0 };
                    }
                    modelUsage[msg.model_id].tokens += tokens;
                    modelUsage[msg.model_id].cost += cost;
                    modelUsage[msg.model_id].responses += 1;
                    modelUsage[msg.model_id].duration += (msg.metrics.duration || 0);
                }

                // Daily stats
                const day = format(new Date(msg.created_date), 'yyyy-MM-dd');
                if (!dailyStats[day]) {
                    dailyStats[day] = { tokens: 0, cost: 0, responses: 0 };
                }
                dailyStats[day].tokens += tokens;
                dailyStats[day].cost += cost;
                dailyStats[day].responses += 1;
            }
        });

        const avgDuration = responseCount > 0 ? totalDuration / responseCount : 0;

        // Convert model usage to array and sort
        const modelRanking = Object.entries(modelUsage)
            .map(([id, data]) => ({
                id,
                name: id.split('/')[1] || id,
                ...data,
                avgDuration: data.responses > 0 ? data.duration / data.responses : 0
            }))
            .sort((a, b) => b.tokens - a.tokens);

        // Convert daily stats to array
        const dailyData = Object.entries(dailyStats)
            .map(([date, data]) => ({
                date,
                displayDate: format(new Date(date), 'dd/MM', { locale: ptBR }),
                ...data
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            totalTokens,
            totalCost,
            avgDuration,
            responseCount,
            conversationCount: filteredConversations.length,
            modelRanking,
            dailyData
        };
    }, [filteredMessages, filteredConversations]);

    const formatTokens = (tokens) => {
        if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
        if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
        return tokens.toString();
    };

    const formatCost = (cost) => {
        if (!cost || cost === 0) return '$0.00';
        if (cost < 0.01) return `$${cost.toFixed(4)}`;
        return `$${cost.toFixed(2)}`;
    };

    const formatDuration = (ms) => {
        if (!ms || ms === 0) return '0s';
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    // Pie chart data
    const pieData = metrics.modelRanking.slice(0, 8).map((m, i) => ({
        name: m.name,
        value: m.tokens,
        color: COLORS[i % COLORS.length]
    }));

    return (
        <AdminProtection>
            <AdminLayout currentPage="MultiChatAnalytics">
                <div className="space-y-8 w-full">
            {/* Header with improved styling */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-lg shadow-pink-200/50">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        Relatório Multi Chat
                    </h1>
                    <p className="text-slate-500 mt-1 ml-14">Insights detalhados sobre performance e custos</p>
                </div>

                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                        <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                        <SelectItem value="90">Últimos 90 dias</SelectItem>
                        <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Main Stats Grid - Redesigned */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-violet-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-24 h-24" />
                    </div>
                    <CardContent className="pt-6 relative z-10">
                        <p className="text-indigo-100 text-sm font-medium mb-1">Total de Conversas</p>
                        <p className="text-4xl font-bold">{metrics.conversationCount}</p>
                        <div className="mt-4 flex items-center text-xs text-indigo-100 bg-white/10 w-fit px-2 py-1 rounded-full">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {metrics.responseCount} respostas geradas
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Consumo de Tokens</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{formatTokens(metrics.totalTokens)}</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Hash className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: '70%' }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Custo Estimado</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{formatCost(metrics.totalCost)}</p>
                            </div>
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <Coins className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: '45%' }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Tempo Médio</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{formatDuration(metrics.avgDuration)}</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: '60%' }}></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <Card className="lg:col-span-2 border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle>Evolução de Uso</CardTitle>
                        <CardDescription>Acompanhe o consumo diário de tokens e custos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={metrics.dailyData}>
                                    <defs>
                                        <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis 
                                        dataKey="displayDate" 
                                        tick={{ fontSize: 12, fill: '#64748b' }} 
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis 
                                        yAxisId="left" 
                                        tick={{ fontSize: 12, fill: '#64748b' }} 
                                        axisLine={false}
                                        tickLine={false}
                                        dx={-10}
                                    />
                                    <YAxis 
                                        yAxisId="right" 
                                        orientation="right" 
                                        tick={{ fontSize: 12, fill: '#64748b' }} 
                                        axisLine={false}
                                        tickLine={false}
                                        dx={10}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '12px', 
                                            border: 'none', 
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            padding: '12px'
                                        }}
                                        formatter={(value, name) => {
                                            if (name === 'tokens') return [formatTokens(value), 'Tokens'];
                                            if (name === 'cost') return [formatCost(value), 'Custo'];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />
                                    <Line 
                                        yAxisId="left" 
                                        type="monotone" 
                                        dataKey="tokens" 
                                        stroke="#ec4899" 
                                        strokeWidth={3} 
                                        dot={false} 
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                        name="Tokens" 
                                    />
                                    <Line 
                                        yAxisId="right" 
                                        type="monotone" 
                                        dataKey="cost" 
                                        stroke="#f59e0b" 
                                        strokeWidth={3} 
                                        dot={false} 
                                        name="Custo ($)" 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Models & Distribution */}
                <div className="space-y-6">
                    <Card className="border-slate-100 shadow-sm h-full">
                        <CardHeader>
                            <CardTitle>Top Modelos</CardTitle>
                            <CardDescription>Por volume de tokens</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            cornerRadius={5}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="space-y-3">
                                {metrics.modelRanking.slice(0, 4).map((model, idx) => (
                                    <div key={model.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">{model.name}</span>
                                                <span className="text-xs text-slate-500">{model.responses} res.</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-mono text-slate-600">{formatTokens(model.tokens)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Vote Rankings Card */}
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Ranking de Votos - Melhores Respostas
                    </CardTitle>
                    <CardDescription>Modelos mais votados como "melhor resposta" pelos usuários</CardDescription>
                </CardHeader>
                <CardContent>
                    {voteRankings.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <ThumbsUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Nenhum voto registrado no período</p>
                            <p className="text-xs mt-1">Os votos aparecerão aqui quando usuários votarem nas respostas</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {voteRankings.slice(0, 9).map((model, idx) => (
                                <div 
                                    key={model.model_id} 
                                    className={`
                                        relative p-4 rounded-xl border transition-all hover:shadow-md
                                        ${idx === 0 ? 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-300 shadow-sm' : 
                                          idx === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-50 border-slate-300' :
                                          idx === 2 ? 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300' :
                                          'bg-white border-slate-200'}
                                    `}
                                >
                                    {idx < 3 && (
                                        <div className={`
                                            absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg
                                            ${idx === 0 ? 'bg-amber-500 text-white' : 
                                              idx === 1 ? 'bg-slate-400 text-white' :
                                              'bg-orange-400 text-white'}
                                        `}>
                                            {idx + 1}º
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`
                                            p-2 rounded-lg
                                            ${idx === 0 ? 'bg-amber-200' : 'bg-slate-100'}
                                        `}>
                                            <Bot className={`w-5 h-5 ${idx === 0 ? 'text-amber-700' : 'text-slate-600'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{model.model_alias}</p>
                                            <p className="text-[10px] text-slate-400 font-mono truncate">{model.model_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-amber-600">
                                            <Trophy className="w-4 h-4" />
                                            <span className="text-2xl font-bold">{model.votes}</span>
                                            <span className="text-xs text-slate-500">votos</span>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            em {model.unique_conversations} conversas
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detailed Model Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Detalhamento por Modelo</CardTitle>
                    <CardDescription>Métricas completas de cada modelo</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Modelo</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Respostas</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tokens</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Custo</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tempo Médio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.modelRanking.map((model) => (
                                    <tr key={model.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Bot className="w-4 h-4 text-indigo-500" />
                                                <span className="font-medium text-slate-900">{model.name}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-mono">{model.id}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-600">{model.responses}</td>
                                        <td className="py-3 px-4 text-right font-medium text-slate-900">{formatTokens(model.tokens)}</td>
                                        <td className="py-3 px-4 text-right font-medium text-amber-600">{formatCost(model.cost)}</td>
                                        <td className="py-3 px-4 text-right text-slate-600">{formatDuration(model.avgDuration)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {metrics.modelRanking.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Nenhum dado de uso encontrado no período selecionado</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
                </div>
            </AdminLayout>
        </AdminProtection>
    );
}