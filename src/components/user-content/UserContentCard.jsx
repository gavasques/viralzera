import React from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, MessageSquare, Megaphone, Blocks, FileText, Copy, Check, Star } from "lucide-react";
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

const TYPE_CONFIG = {
  introduction: {
    Icon: MessageSquare,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    label: 'Introdução',
    queryKey: 'user-introductions',
    entity: 'UserIntroduction'
  },
  cta: {
    Icon: Megaphone,
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    label: 'CTA',
    queryKey: 'user-ctas',
    entity: 'UserCTA'
  },
  block: {
    Icon: Blocks,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    label: 'Bloco',
    queryKey: 'description-blocks',
    entity: 'DescriptionBlock'
  },
  template: {
    Icon: FileText,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    label: 'Template',
    queryKey: 'description-templates',
    entity: 'DescriptionTemplate'
  }
};

export default function UserContentCard({ item, type, onEdit }) {
  const queryClient = useQueryClient();
  const [copiedSlug, setCopiedSlug] = React.useState(false);
  
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.introduction;
  const { Icon, bgColor, iconColor, label, queryKey, entity } = config;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return neon.entities[entity].delete(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(`${label} excluído!`);
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + (error.message || 'Tente novamente'));
    },
  });

  const copyPlaceholder = () => {
    if (type === 'block' && item.slug) {
      navigator.clipboard.writeText(`{{bloco:${item.slug}}}`);
      setCopiedSlug(true);
      toast.success('Placeholder copiado!');
      setTimeout(() => setCopiedSlug(false), 2000);
    }
  };

  const contentPreview = item.content
    ? item.content.substring(0, 120) + (item.content.length > 120 ? '...' : '')
    : 'Sem conteúdo';

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bgColor}`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-slate-900 line-clamp-1 flex items-center gap-2">
                {item.title}
                {type === 'template' && item.is_default && (
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                )}
              </CardTitle>
              {type === 'block' && item.slug && (
                <button 
                  onClick={copyPlaceholder}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mt-0.5"
                >
                  <code className="bg-slate-100 px-1 rounded">{`{{bloco:${item.slug}}}`}</code>
                  {copiedSlug ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
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
                  <AlertDialogTitle>Excluir {label}?</AlertDialogTitle>
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
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {item.content?.length?.toLocaleString() || 0} caracteres
          </Badge>
          {type === 'block' && item.type && (
            <Badge variant="outline" className="text-xs">
              {item.type}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}