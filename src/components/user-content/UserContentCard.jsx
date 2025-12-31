import React from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, MessageSquare, Megaphone } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UserContentCard({ item, type, onEdit }) {
  const queryClient = useQueryClient();
  const isIntroduction = type === 'introduction';
  const Icon = isIntroduction ? MessageSquare : Megaphone;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (isIntroduction) {
        return base44.entities.UserIntroduction.delete(item.id);
      } else {
        return base44.entities.UserCTA.delete(item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: isIntroduction ? ['user-introductions'] : ['user-ctas'] 
      });
      toast.success(`${isIntroduction ? 'Introdução' : 'CTA'} excluído!`);
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + (error.message || 'Tente novamente'));
    },
  });

  const contentPreview = item.content
    ? item.content.substring(0, 120) + (item.content.length > 120 ? '...' : '')
    : 'Sem conteúdo';

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isIntroduction ? 'bg-blue-50' : 'bg-amber-50'}`}>
              <Icon className={`w-4 h-4 ${isIntroduction ? 'text-blue-600' : 'text-amber-600'}`} />
            </div>
            <CardTitle className="text-sm font-semibold text-slate-900 line-clamp-1">
              {item.title}
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 text-slate-400 hover:text-slate-600"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir {isIntroduction ? 'Introdução' : 'CTA'}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O item "{item.title}" será permanentemente excluído.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-slate-500 line-clamp-3 mb-3">
          {contentPreview}
        </p>
        <Badge variant="secondary" className="text-xs">
          {item.content?.length?.toLocaleString() || 0} caracteres
        </Badge>
      </CardContent>
    </Card>
  );
}