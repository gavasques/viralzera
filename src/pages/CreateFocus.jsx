import React, { useEffect, useState } from 'react';
import { neon } from "@/api/neonClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, Layout, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSelectedFocus, FOCUS_QUERY_KEYS } from "@/components/hooks/useSelectedFocus";

export default function CreateFocus() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  
  const { selectedFocusId, setFocus, refreshFocuses, clearSelection } = useSelectedFocus();

  const [formData, setFormData] = useState({
    title: "",
    platform: "Instagram",
    description: ""
  });

  // Fetch existing data if editing
  const { data: existingFocus, isLoading: isLoadingData } = useQuery({
    queryKey: FOCUS_QUERY_KEYS.SINGLE(id),
    queryFn: async () => {
      const results = await neon.entities.Focus.filter({ id });
      return results[0] || null;
    },
    enabled: !!id,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (existingFocus) {
      setFormData(existingFocus);
    }
  }, [existingFocus]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (id) return neon.entities.Focus.update(id, data);
      return neon.entities.Focus.create(data);
    },
    onSuccess: async (result) => {
      toast.success(id ? "Foco atualizado com sucesso!" : "Foco criado com sucesso!");
      
      // Invalidate all focus-related queries
      queryClient.invalidateQueries({ queryKey: FOCUS_QUERY_KEYS.LIST });
      if (id) {
        queryClient.invalidateQueries({ queryKey: FOCUS_QUERY_KEYS.SINGLE(id) });
      }
      
      // If creating new focus, select it
      if (!id && result?.id) {
        // Wait for list to refresh before selecting
        await queryClient.refetchQueries({ queryKey: FOCUS_QUERY_KEYS.LIST });
        setFocus(result.id);
      }
      
      navigate(createPageUrl('Dashboard'));
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => neon.entities.Focus.delete(id),
    onSuccess: async () => {
      toast.success("Foco excluído com sucesso!");
      
      // Clear selection if deleted focus was selected
      if (selectedFocusId === id) {
        clearSelection();
      }
      
      // Invalidate and refetch focuses list
      await queryClient.invalidateQueries({ queryKey: FOCUS_QUERY_KEYS.LIST });
      queryClient.removeQueries({ queryKey: FOCUS_QUERY_KEYS.SINGLE(id) });
      
      window.dispatchEvent(new Event('focus-change'));
      navigate(createPageUrl('Dashboard'));
    },
    onError: (error) => toast.error("Erro ao excluir: " + error.message)
  });

  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir este foco? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error("O nome é obrigatório");
    saveMutation.mutate(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (id && isLoadingData) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Dashboard'))}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{id ? 'Editar Foco' : 'Novo Foco'}</h1>
          <p className="text-slate-500 text-sm">Defina a estratégia para este canal.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-500" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nome do Perfil / Foco</Label>
              <Input 
                placeholder="Ex: GuilhermeVasques Amazon" 
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select 
                value={formData.platform} 
                onValueChange={(val) => updateField('platform', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label>Descrição / Bio Estratégica</Label>
              <Textarea 
                placeholder="Sobre o que esse perfil fala? Qual o tom de voz?"
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                className="h-24"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4 items-center">
          {id ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Foco
            </Button>
          ) : <div />}
          
          <Button 
            size="lg" 
            type="submit" 
            disabled={saveMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px] shadow-xl shadow-indigo-200"
          >
            {saveMutation.isPending ? 'Salvando...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Foco
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}