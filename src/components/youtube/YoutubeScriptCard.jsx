import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Youtube, Clock, FileText, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLORS = {
  "Rascunho": "bg-slate-100 text-slate-700",
  "Roteiro Pronto": "bg-blue-100 text-blue-700",
  "Finalizado": "bg-green-100 text-green-700"
};

const CATEGORIA_COLORS = {
  "Amazon": "bg-orange-100 text-orange-700",
  "Importação": "bg-purple-100 text-purple-700",
  "Ferramentas": "bg-cyan-100 text-cyan-700",
  "Gestão": "bg-indigo-100 text-indigo-700",
  "Dubai": "bg-amber-100 text-amber-700",
  "Marketplaces": "bg-emerald-100 text-emerald-700",
  "Economia": "bg-green-100 text-green-700",
  "Genérico": "bg-slate-100 text-slate-700",
  "Inteligência Artificial": "bg-violet-100 text-violet-700",
  "Parcerias": "bg-pink-100 text-pink-700",
  "Aulas": "bg-blue-100 text-blue-700",
  "Política": "bg-red-100 text-red-700",
  "Mercado Livre": "bg-yellow-100 text-yellow-700",
  "Shopee": "bg-orange-100 text-orange-700",
  "Tiktok Shop": "bg-fuchsia-100 text-fuchsia-700",
  "Afiliados": "bg-teal-100 text-teal-700",
  "Outros": "bg-gray-100 text-gray-700"
};

const VIDEO_TYPE_COLORS = {
  "Tutorial": "bg-indigo-100 text-indigo-700",
  "Lista": "bg-purple-100 text-purple-700",
  "Dica Rápida": "bg-amber-100 text-amber-700",
  "Review": "bg-pink-100 text-pink-700",
  "Vlog": "bg-cyan-100 text-cyan-700",
  "Entrevista": "bg-emerald-100 text-emerald-700",
  "Outro": "bg-slate-100 text-slate-700"
};

export default function YoutubeScriptCard({ script, onClick, onDelete }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete?.(script.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
    <Card 
      className="group cursor-pointer hover:shadow-md transition-all border-slate-200 hover:border-red-200 bg-white overflow-hidden relative"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="p-2 bg-red-50 rounded-lg shrink-0">
            <Youtube className="w-5 h-5 text-red-600" />
          </div>
          
          {/* Title & Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate mb-0.5">
              {script.title || "Sem título"}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <Badge variant="secondary" className={`text-[10px] h-4 px-1.5 border-0 ${VIDEO_TYPE_COLORS[script.video_type] || VIDEO_TYPE_COLORS["Outro"]}`}>
                {script.video_type || "Outro"}
              </Badge>
              <Badge variant="secondary" className={`text-[10px] h-4 px-1.5 border-0 ${STATUS_COLORS[script.status] || STATUS_COLORS["Rascunho"]}`}>
                {script.status || "Rascunho"}
              </Badge>
              {script.categoria && (
                <Badge variant="outline" className={`text-[10px] h-4 px-1.5 border ${CATEGORIA_COLORS[script.categoria] || CATEGORIA_COLORS["Outros"]}`}>
                  {script.categoria}
                </Badge>
              )}
              <span className="text-[10px] text-slate-400">
                • {format(new Date(script.created_date), "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            {script.duracao_estimada && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-500" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{script.duracao_estimada}</p>
                  <p className="text-[9px] text-slate-400 leading-none">min</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <div>
                <p className="text-sm font-bold text-slate-900">{(script.corpo?.length || 0).toLocaleString()}</p>
                <p className="text-[9px] text-slate-400 leading-none">chars</p>
              </div>
            </div>
          </div>
          
          {/* Delete Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <AlertDialogTitle className="text-center">Excluir Roteiro</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Tem certeza que deseja excluir <strong>"{script.title || 'Sem título'}"</strong>? 
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}