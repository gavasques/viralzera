import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import { Lightbulb, Save, Loader2, Pencil, X } from "lucide-react";

export default function CreatorIdeaEditor({ modeling }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [idea, setIdea] = useState(modeling?.creator_idea || '');

  useEffect(() => {
    setIdea(modeling?.creator_idea || '');
  }, [modeling?.creator_idea]);

  const updateMutation = useMutation({
    mutationFn: (data) => neon.entities.Modeling.update(modeling.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modeling', modeling.id] });
      queryClient.invalidateQueries({ queryKey: ['modelings-wizard-tema'] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Ideia salva!');
      setIsEditing(false);
    },
    onError: (err) => toast.error('Erro ao salvar: ' + err.message)
  });

  const handleSave = () => {
    updateMutation.mutate({ creator_idea: idea });
  };

  const handleCancel = () => {
    setIdea(modeling?.creator_idea || '');
    setIsEditing(false);
  };

  const charCount = idea.length;
  const tokenEstimate = Math.ceil(charCount / 4);

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Ideia do Criador
          </CardTitle>
          {!isEditing ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-1" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Salvar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Descreva sua ideia para o conteúdo...

• Qual é o tema principal?
• Qual o objetivo do vídeo?
• Quais pontos você quer abordar?
• Qual o estilo/tom desejado?
• Qual o público-alvo?
• Referências ou inspirações?"
              className="min-h-[250px] text-sm bg-white"
            />
            <div className="text-xs text-slate-500 text-right">
              {charCount.toLocaleString()} caracteres • ~{tokenEstimate.toLocaleString()} tokens
            </div>
          </div>
        ) : (
          <div className="min-h-[100px]">
            {idea ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap text-sm">{idea}</p>
                <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">
                  {charCount.toLocaleString()} caracteres • ~{tokenEstimate.toLocaleString()} tokens
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="w-10 h-10 text-amber-200 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  Nenhuma ideia registrada ainda.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setIsEditing(true)}
                >
                  Adicionar Ideia
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}