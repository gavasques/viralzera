import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trophy, Bot, Users, ThumbsUp } from "lucide-react";
import { format, parseISO } from "date-fns";

function VoteStatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    amber: 'bg-gradient-to-br from-amber-500 to-orange-600',
    indigo: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    purple: 'bg-gradient-to-br from-purple-500 to-violet-600'
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`${colorClasses[color]} p-2.5 rounded-lg shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function VotesSection({ votes, rankings }) {
  const uniqueVoters = new Set(votes.map(v => v.created_by)).size;

  return (
    <div className="space-y-6">
      {/* Vote Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VoteStatCard icon={Trophy} label="Total de Votos" value={votes.length} color="amber" />
        <VoteStatCard icon={Bot} label="Modelos Votados" value={rankings.length} color="indigo" />
        <VoteStatCard icon={Users} label="Usuários Votantes" value={uniqueVoters} color="purple" />
      </div>

      {/* Rankings */}
      <Card className="border-0 shadow-sm bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-lg">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            Ranking de Melhores Respostas
          </CardTitle>
          <CardDescription>Modelos mais votados como "melhor resposta"</CardDescription>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ThumbsUp className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">Nenhum voto registrado</p>
              <p className="text-sm text-slate-400 mt-1">Os votos aparecerão aqui quando usuários votarem no Multi Chat</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankings.slice(0, 9).map((model, idx) => (
                <div 
                  key={model.model_id}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all hover:shadow-md
                    ${idx === 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300' : 
                      idx === 1 ? 'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-300' :
                      idx === 2 ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200' :
                      'bg-white border-slate-200'}
                  `}
                >
                  {idx < 3 && (
                    <div className={`
                      absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg
                      ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 
                        idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                        'bg-gradient-to-br from-orange-300 to-amber-400 text-white'}
                    `}>
                      {idx + 1}º
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${idx === 0 ? 'bg-amber-200' : 'bg-slate-100'}`}>
                      <Bot className={`w-5 h-5 ${idx === 0 ? 'text-amber-700' : 'text-slate-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate text-sm">{model.model_alias}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{model.model_id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="text-xl font-bold text-slate-900">{model.votes}</span>
                      <span className="text-xs text-slate-400">votos</span>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      <p>{model.unique_conversations} conversas</p>
                      <p>{model.unique_users} usuários</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Votes */}
      {votes.length > 0 && (
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Votos Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="divide-y divide-slate-100">
                {votes.slice(0, 50).map((vote) => (
                  <div key={vote.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-1.5 rounded-full">
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {vote.model_alias || vote.model_id?.split('/').pop()}
                        </p>
                        <p className="text-xs text-slate-400">{vote.created_by?.split('@')[0]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {vote.context === 'multi_chat' ? 'Multi Chat' : vote.context}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {format(parseISO(vote.created_date), 'dd/MM HH:mm')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}