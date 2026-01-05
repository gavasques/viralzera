import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dna, Eye, Trash2, Loader2, CheckCircle, AlertCircle, Power, EyeOff } from "lucide-react";
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-slate-100 text-slate-600' },
  processing: { label: 'Processando...', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  completed: { label: 'Completo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  error: { label: 'Erro', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

export default function DNAProfileCard({ profile, onView, onDelete, onToggleActive }) {
  const status = statusConfig[profile.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const signature = profile.signature;

  return (
    <Card className={`group hover:shadow-md transition-all ${profile.is_active === false ? 'opacity-75 border-slate-300 bg-slate-50' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <Dna className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{profile.title}</h3>
              <p className="text-xs text-slate-500">
                {profile.content_ids?.length || 0} conteúdos • {format(new Date(profile.created_date), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
          
          <Badge className={status.color}>
            {StatusIcon && (
              <StatusIcon className={`w-3 h-3 mr-1 ${StatusIcon === Loader2 ? 'animate-spin' : ''}`} />
            )}
            {status.label}
          </Badge>
        </div>

        {signature && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-700 italic">
              "{signature.resumo_em_1_linha || 'Análise disponível'}"
            </p>
            
            {signature.tom && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="outline" className="text-xs">
                  Energia: {signature.tom.energia}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Humor: {signature.tom.humor}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Direto: {signature.tom.direto}
                </Badge>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleActive}
            className={`flex-1 ${profile.is_active === false ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-slate-600 hover:text-slate-700'}`}
          >
            <Power className="w-4 h-4 mr-2" />
            {profile.is_active === false ? "Ativar" : "Inativar"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            disabled={profile.status !== 'completed'}
            className="flex-[2]"
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver DNA
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-400 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {profile.is_active === false && (
          <div className="mt-3 -mx-5 -mb-5 px-5 py-2 bg-slate-200 border-t border-slate-300 flex items-center justify-center text-xs font-medium text-slate-500">
            <EyeOff className="w-3 h-3 mr-1.5" />
            Perfil Inativo
          </div>
        )}
      </CardContent>
    </Card>
  );
}