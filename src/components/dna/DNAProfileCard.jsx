import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dna, Eye, Trash2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import moment from 'moment';

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-slate-100 text-slate-600' },
  processing: { label: 'Processando...', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  completed: { label: 'Completo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  error: { label: 'Erro', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

export default function DNAProfileCard({ profile, onView, onDelete }) {
  const status = statusConfig[profile.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const signature = profile.signature;

  return (
    <Card className="group hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <Dna className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{profile.title}</h3>
              <p className="text-xs text-slate-500">
                {profile.content_ids?.length || 0} conteúdos • {moment(profile.created_date).format('DD/MM/YYYY')}
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
            onClick={onView}
            disabled={profile.status !== 'completed'}
            className="flex-1"
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
      </CardContent>
    </Card>
  );
}