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
  "Finalizado": "bg-green-100 text-green-700",
  "Publicado": "bg-blue-100 text-blue-700"
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
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-red-200 bg-white overflow-hidden relative"
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteDialog(true);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3 pr-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <Youtube className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate text-base">
                {script.title || "Sem título"}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-[10px] px-1.5 py-0 h-5 ${VIDEO_TYPE_COLORS[script.video_type] || VIDEO_TYPE_COLORS["Outro"]}`}>
                  {script.video_type || "Outro"}
                </Badge>
                <Badge className={`text-[10px] px-1.5 py-0 h-5 ${STATUS_COLORS[script.status] || STATUS_COLORS["Rascunho"]}`}>
                  {script.status || "Rascunho"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        {script.hook && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 bg-slate-50 p-2 rounded-lg">
            {script.hook}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {script.duracao_estimada && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {script.duracao_estimada} min
              </span>
            )}
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {(script.corpo?.length || 0).toLocaleString()} chars
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {format(new Date(script.created_date), "dd MMM yyyy", { locale: ptBR })}
          </span>
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