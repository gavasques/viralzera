import React, { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Plus, Pencil, Trash2, Sparkles, ChevronDown, ChevronRight, FolderOpen, Loader2, Eye, Settings, Brain, Keyboard, Power, EyeOff, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useFocusData } from "@/components/hooks/useFocusData";
import { useEntityCRUD } from "@/components/hooks/useEntityCRUD";
import { neon } from "@/api/neonClient";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/common/PageHeader";
import InfoCard from "@/components/common/InfoCard";
import EmptyState from "@/components/common/EmptyState";
import { ListSkeleton } from "@/components/common/LoadingSkeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import ConfirmDialog from "@/components/common/ConfirmDialog";

const FUNNEL_COLORS = {
  "Topo de Funil": "bg-blue-100 text-blue-800",
  "Meio de Funil": "bg-yellow-100 text-yellow-800",
  "Fundo de Funil": "bg-green-100 text-green-800"
};

const EMPTY_FORM = {
  name: "",
  funnel_stage: "Topo de Funil",
  description: "",
  pains: "",
  ambitions: "",
  habits: "",
  common_enemy: "",
  group_id: ""
};

const EMPTY_GROUP_FORM = {
  name: "",
  description: ""
};

export default function Audiences() {
  const [isOpen, setIsOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [groupForm, setGroupForm] = useState(EMPTY_GROUP_FORM);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedAudiences, setExpandedAudiences] = useState({});
  const [quickGroupName, setQuickGroupName] = useState('');
  const [isCreatingQuickGroup, setIsCreatingQuickGroup] = useState(false);
  const [quickGroupPopoverOpen, setQuickGroupPopoverOpen] = useState(false);
  const [viewingAudience, setViewingAudience] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  
  
  // New States
  const [showCreationType, setShowCreationType] = useState(false);
  const [deleteData, setDeleteData] = useState({ open: false, type: null, id: null, title: '' });
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: audiences, isLoading, selectedFocusId } = useFocusData('Audience', 'audiences');
  const { data: groups, isLoading: isLoadingGroups } = useFocusData('AudienceGroup', 'audienceGroups');
  
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleGroupClose = useCallback(() => {
    setIsGroupOpen(false);
    setEditingGroupId(null);
    setGroupForm(EMPTY_GROUP_FORM);
  }, []);

  const { save, remove, isSaving } = useEntityCRUD('Audience', 'audiences', {
    onSaveSuccess: handleClose,
    saveSuccessMessage: editingId ? "Público atualizado!" : "Público criado!",
    deleteSuccessMessage: "Público removido!"
  });

  const { save: saveGroup, remove: removeGroup, isSaving: isSavingGroup } = useEntityCRUD('AudienceGroup', 'audienceGroups', {
    onSaveSuccess: handleGroupClose,
    saveSuccessMessage: editingGroupId ? "Grupo atualizado!" : "Grupo criado!",
    deleteSuccessMessage: "Grupo removido!"
  });

  const confirmDelete = (type, id, title) => {
    setDeleteData({
      open: true,
      type,
      id,
      title: `Excluir ${type === 'group' ? 'grupo' : 'público'} "${title}"?`
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteData.type === 'group') {
      removeGroup(deleteData.id);
    } else {
      remove(deleteData.id);
    }
    setDeleteData({ ...deleteData, open: false });
  };

  const handleOpen = useCallback((audience = null, groupId = null) => {
    if (audience) {
      setEditingId(audience.id);
      setForm({
        name: audience.name || "",
        funnel_stage: audience.funnel_stage || "Topo de Funil",
        description: audience.description || "",
        pains: audience.pains || "",
        ambitions: audience.ambitions || "",
        habits: audience.habits || "",
        common_enemy: audience.common_enemy || "",
        group_id: audience.group_id || ""
      });
    } else {
      setEditingId(null);
      setForm({ ...EMPTY_FORM, group_id: groupId || "" });
    }
    setIsOpen(true);
  }, []);

  const handleGroupOpen = useCallback((group = null) => {
    if (group) {
      setEditingGroupId(group.id);
      setGroupForm({
        name: group.name || "",
        description: group.description || ""
      });
    } else {
      setEditingGroupId(null);
      setGroupForm(EMPTY_GROUP_FORM);
    }
    setIsGroupOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!form.group_id) {
      toast.error("Grupo é obrigatório");
      return;
    }
    if (!form.pains.trim()) {
      toast.error("Dores é obrigatório");
      return;
    }
    if (!form.common_enemy.trim()) {
      toast.error("Inimigos Comuns é obrigatório");
      return;
    }
    const data = editingId ? form : { ...form, focus_id: selectedFocusId };
    save(editingId, data);
  }, [form, editingId, selectedFocusId, save]);

  const handleGroupSave = useCallback(() => {
    if (!groupForm.name.trim()) {
      toast.error("Nome do grupo é obrigatório");
      return;
    }
    const data = editingGroupId ? groupForm : { ...groupForm, focus_id: selectedFocusId };
    saveGroup(editingGroupId, data);
  }, [groupForm, editingGroupId, selectedFocusId, saveGroup]);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getAudiencesByGroup = (groupId) => {
    return audiences.filter(a => a.group_id === groupId && (showInactive || a.is_active !== false));
  };

  const ungroupedAudiences = audiences.filter(a => !a.group_id && (showInactive || a.is_active !== false));

  const toggleAudienceActive = async (audience) => {
    try {
      const newStatus = audience.is_active === false ? true : false;
      await save(audience.id, { ...audience, is_active: newStatus });
      toast.success(newStatus ? "Público ativado!" : "Público inativado!");
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
  };

  const toggleAudienceDefault = async (audience) => {
    try {
      if (audience.is_default) {
        await save(audience.id, { ...audience, is_default: false });
        toast.success("Público padrão removido!");
      } else {
        const others = audiences.filter(a => a.id !== audience.id && a.is_default);
        await Promise.all(others.map(a => save(a.id, { ...a, is_default: false })));
        
        await save(audience.id, { ...audience, is_default: true });
        toast.success("Público definido como padrão!");
      }
    } catch (error) {
      toast.error("Erro ao definir padrão");
    }
  };

  const toggleGroupActive = async (group) => {
    try {
      const newStatus = group.is_active === false ? true : false;
      await saveGroup(group.id, { ...group, is_active: newStatus });
      toast.success(newStatus ? "Grupo ativado!" : "Grupo inativado!");
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
  };

  const handleQuickGroupCreate = async () => {
    if (!quickGroupName.trim()) {
      toast.error("Nome do grupo é obrigatório");
      return;
    }
    setIsCreatingQuickGroup(true);
    try {
      const newGroup = await neon.entities.AudienceGroup.create({
        name: quickGroupName,
        focus_id: selectedFocusId
      });
      queryClient.invalidateQueries({ queryKey: ['audienceGroups'] });
      setForm({ ...form, group_id: newGroup.id });
      setQuickGroupName('');
      setQuickGroupPopoverOpen(false);
      toast.success("Grupo criado!");
    } catch (error) {
      toast.error("Erro ao criar grupo");
    } finally {
      setIsCreatingQuickGroup(false);
    }
  };

  if (isLoading || isLoadingGroups) {
    return (
      <div className="space-y-6">
        <PageHeader title="Público-Alvo" subtitle="Carregando..." icon={Users} />
        <ListSkeleton count={3} />
      </div>
    );
  }

  const toggleAudience = (audienceId) => {
    setExpandedAudiences(prev => ({ ...prev, [audienceId]: !prev[audienceId] }));
  };

  const AudienceCard = ({ audience }) => {
    const isExpanded = expandedAudiences[audience.id];
    const hasLongDescription = audience.description && audience.description.length > 150;

    return (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
        <Collapsible open={isExpanded} onOpenChange={() => hasLongDescription && toggleAudience(audience.id)}>
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900">{audience.name}</h4>
                  <Badge className={`${FUNNEL_COLORS[audience.funnel_stage]} text-xs`}>
                    {audience.funnel_stage}
                  </Badge>
                  {audience.is_default && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-xs gap-1 ml-1">
                      <Star className="w-3 h-3 fill-amber-700" /> Padrão
                    </Badge>
                  )}
                </div>
                {audience.description && (
                  <div>
                    <p className={`text-slate-600 text-sm ${!isExpanded && hasLongDescription ? 'line-clamp-2' : ''}`}>
                      {audience.description}
                    </p>
                    {hasLongDescription && (
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 mt-1 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          {isExpanded ? (
                            <>Ver menos <ChevronDown className="w-3 h-3 ml-1" /></>
                          ) : (
                            <>Ver mais <ChevronRight className="w-3 h-3 ml-1" /></>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${audience.is_default ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-500'}`}
                  onClick={() => toggleAudienceDefault(audience)}
                  title={audience.is_default ? "Remover Padrão" : "Definir como Padrão"}
                >
                  <Star className={`w-3.5 h-3.5 ${audience.is_default ? "fill-amber-500" : ""}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${audience.is_active === false ? 'text-slate-400 hover:text-green-600' : 'text-green-600 hover:text-slate-400'}`}
                  onClick={() => toggleAudienceActive(audience)}
                  title={audience.is_active === false ? "Ativar" : "Inativar"}
                >
                  <Power className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingAudience(audience)}>
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpen(audience)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                  onClick={() => confirmDelete('audience', audience.id, audience.name)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
          {audience.is_active === false && (
            <div className="bg-slate-100 px-4 py-1 text-xs text-slate-500 font-medium flex items-center justify-center border-t border-slate-200">
              <EyeOff className="w-3 h-3 mr-1.5" /> Inativo
            </div>
          )}
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Público-Alvo" 
        subtitle="Defina quem é seu público e suas características"
        icon={Users}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowInactive(!showInactive)}
              className={showInactive ? "bg-slate-100 border-slate-300" : ""}
            >
              {showInactive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showInactive ? "Ocultar Inativos" : "Mostrar Inativos"}
            </Button>

            <Button onClick={() => setShowCreationType(true)} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200">
              <Plus className="w-4 h-4 mr-2" /> Novo Público
            </Button>
          </div>
        }
      />



      <InfoCard 
        icon={Sparkles}
        title="Por que definir o público-alvo?"
        description="Conhecer as dores, hábitos e ambições do seu público permite criar conteúdo que ressoa e gera engajamento. A IA usará essas informações para criar mensagens direcionadas."
        variant="blue"
      />

      <div className="space-y-4">
        {groups.length === 0 && audiences.length === 0 ? (
          <EmptyState 
            icon={Users}
            description="Nenhum público cadastrado ainda"
            actionLabel="Criar primeiro grupo"
            onAction={() => handleGroupOpen()}
          />
        ) : (
          <>
            {/* Grupos de Público */}
            {groups.filter(g => showInactive || g.is_active !== false).map((group) => {
              const groupAudiences = getAudiencesByGroup(group.id);
              const isExpanded = expandedGroups[group.id] !== false;
              
              return (
                <Card key={group.id} className={`overflow-hidden ${group.is_active === false ? 'opacity-75 border-slate-300 bg-slate-50' : ''}`}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(group.id)}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 bg-slate-50 border-b cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-500" />
                          )}
                          <FolderOpen className="w-5 h-5 text-indigo-600" />
                          <div>
                            <h3 className="font-bold text-slate-900">{group.name}</h3>
                            {group.description && (
                              <p className="text-sm text-slate-500">{group.description}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {groupAudiences.length} público(s)
                          </Badge>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-8 w-8 ${group.is_active === false ? 'text-slate-400 hover:text-green-600' : 'text-green-600 hover:text-slate-400'}`}
                            onClick={() => toggleGroupActive(group)}
                            title={group.is_active === false ? "Ativar Grupo" : "Inativar Grupo"}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpen(null, group.id)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleGroupOpen(group)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => confirmDelete('group', group.id, group.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        </div>
                        </CollapsibleTrigger>
                        {group.is_active === false && (
                        <div className="bg-slate-200 px-4 py-1 text-xs text-slate-500 font-medium flex items-center justify-center border-t border-slate-300">
                           <EyeOff className="w-3 h-3 mr-1.5" /> Grupo Inativo
                        </div>
                        )}
                        <CollapsibleContent>
                      <CardContent className="p-4 space-y-3">
                        {groupAudiences.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-4">
                            Nenhum público neste grupo. 
                            <Button variant="link" className="px-1 text-indigo-600" onClick={() => handleOpen(null, group.id)}>
                              Adicionar público
                            </Button>
                          </p>
                        ) : (
                          groupAudiences.map(audience => (
                            <AudienceCard key={audience.id} audience={audience} />
                          ))
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}

            {/* Públicos sem grupo */}
            {ungroupedAudiences.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sem Grupo</h3>
                {ungroupedAudiences.map(audience => (
                  <AudienceCard key={audience.id} audience={audience} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Público - Modernizado */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-pink-100 to-rose-100 p-3 rounded-xl">
                <Users className="w-8 h-8 text-pink-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">{editingId ? "Editar Público" : "Novo Público"}</DialogTitle>
                <DialogDescription className="text-base">Mapeie profundamente quem é a pessoa que você quer atingir.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Seção 1: Identidade */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">1</div>
                <h3 className="text-lg font-bold text-slate-900">Identidade e Classificação</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6 space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Nome do Público *</Label>
                  <Input 
                    value={form.name} 
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    placeholder="Ex: O CLT que busca liberdade"
                    className="h-11 bg-white"
                  />
                  <p className="text-xs text-slate-500">Dê um nome memorável para este perfil.</p>
                </div>

                <div className="md:col-span-3 space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Etapa do Funil *</Label>
                  <Select value={form.funnel_stage} onValueChange={(v) => setForm({...form, funnel_stage: v})}>
                    <SelectTrigger className="h-11 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Topo de Funil">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Topo de Funil
                        </div>
                      </SelectItem>
                      <SelectItem value="Meio de Funil">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          Meio de Funil
                        </div>
                      </SelectItem>
                      <SelectItem value="Fundo de Funil">
                         <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Fundo de Funil
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-3 space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Grupo *</Label>
                  <div className="flex gap-2">
                    <Select value={form.group_id || ""} onValueChange={(v) => setForm({...form, group_id: v})}>
                      <SelectTrigger className="h-11 bg-white flex-1">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map(g => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Popover open={quickGroupPopoverOpen} onOpenChange={setQuickGroupPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0 bg-white" title="Criar novo grupo">
                          <Plus className="w-5 h-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-4" align="end">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Criar Novo Grupo</h4>
                          <div className="flex gap-2">
                            <Input 
                              value={quickGroupName}
                              onChange={(e) => setQuickGroupName(e.target.value)}
                              placeholder="Nome do grupo"
                              className="h-9"
                              onKeyDown={(e) => e.key === 'Enter' && handleQuickGroupCreate()}
                            />
                            <Button 
                              onClick={handleQuickGroupCreate} 
                              disabled={isCreatingQuickGroup}
                              size="sm"
                              className="bg-indigo-600"
                            >
                              {isCreatingQuickGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="md:col-span-12 space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Descrição Resumida</Label>
                  <Textarea 
                    value={form.description} 
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Quem é essa pessoa em uma frase? Ex: Pai de família de 35 anos que está frustrado com o emprego corporativo."
                    className="min-h-[80px] bg-white text-base resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Psicografia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dores */}
              <div className="bg-red-50/50 p-6 rounded-xl border border-red-100 space-y-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Dores e Frustrações *</h3>
                </div>
                <p className="text-sm text-slate-500">O que tira o sono dessa pessoa? O que ela não aguenta mais?</p>
                <Textarea 
                  value={form.pains} 
                  onChange={(e) => setForm({...form, pains: e.target.value})}
                  placeholder="Ex: Sente que está jogando a vida fora no escritório; Medo de ser demitido; Falta de tempo com os filhos..."
                  className="min-h-[150px] bg-white border-red-200 focus:border-red-400 focus:ring-red-200 resize-none text-base"
                />
              </div>

              {/* Ambições */}
              <div className="bg-green-50/50 p-6 rounded-xl border border-green-100 space-y-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Ambições e Sonhos</h3>
                </div>
                <p className="text-sm text-slate-500">O que ela mais deseja? Onde ela quer estar em 1 ano?</p>
                <Textarea 
                  value={form.ambitions} 
                  onChange={(e) => setForm({...form, ambitions: e.target.value})}
                  placeholder="Ex: Liberdade geográfica; Ganhar em dólar; Ter tempo para ver os filhos crescerem..."
                  className="min-h-[150px] bg-white border-green-200 focus:border-green-400 focus:ring-green-200 resize-none text-base"
                />
              </div>

              {/* Inimigo Comum */}
              <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-100 space-y-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Inimigo Comum *</h3>
                </div>
                <p className="text-sm text-slate-500">Quem ou o que é o 'vilão' na história dela?</p>
                <Textarea 
                  value={form.common_enemy} 
                  onChange={(e) => setForm({...form, common_enemy: e.target.value})}
                  placeholder="Ex: O chefe abusivo; O governo e os impostos; Os gurus falsos da internet..."
                  className="min-h-[150px] bg-white border-amber-200 focus:border-amber-400 focus:ring-amber-200 resize-none text-base"
                />
              </div>

              {/* Hábitos */}
              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Eye className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Hábitos e Rotina</h3>
                </div>
                <p className="text-sm text-slate-500">O que ela faz no dia a dia? Onde ela consome conteúdo?</p>
                <Textarea 
                  value={form.habits} 
                  onChange={(e) => setForm({...form, habits: e.target.value})}
                  placeholder="Ex: Ouve podcasts no trânsito; Usa Instagram à noite; Lê notícias de economia..."
                  className="min-h-[150px] bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-200 resize-none text-base"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" size="lg" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isSaving} size="lg" className="bg-indigo-600 hover:bg-indigo-700 min-w-[150px]">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : "Salvar Público"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Visualização */}
      <Dialog open={!!viewingAudience} onOpenChange={(open) => !open && setViewingAudience(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              {viewingAudience?.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Badge className={FUNNEL_COLORS[viewingAudience?.funnel_stage]}>
                {viewingAudience?.funnel_stage}
              </Badge>
              {viewingAudience?.group_id && (
                <span className="text-slate-500 text-xs">
                  • Grupo: {groups.find(g => g.id === viewingAudience?.group_id)?.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {viewingAudience?.description && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição</h4>
                <p className="text-slate-700 leading-relaxed text-sm">{viewingAudience.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Dores
                  </h4>
                  <div className="bg-red-50/50 p-3 rounded-md border border-red-100 text-sm text-slate-700 whitespace-pre-wrap">
                    {viewingAudience?.pains || "Nenhuma dor registrada."}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Inimigo Comum
                  </h4>
                  <div className="bg-amber-50/50 p-3 rounded-md border border-amber-100 text-sm text-slate-700 whitespace-pre-wrap">
                    {viewingAudience?.common_enemy || "Nenhum inimigo comum registrado."}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                    Ambições
                  </h4>
                  <div className="bg-green-50/50 p-3 rounded-md border border-green-100 text-sm text-slate-700 whitespace-pre-wrap">
                    {viewingAudience?.ambitions || "Nenhuma ambição registrada."}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Hábitos
                  </h4>
                  <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100 text-sm text-slate-700 whitespace-pre-wrap">
                    {viewingAudience?.habits || "Nenhum hábito registrado."}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t">
               <Button onClick={() => setViewingAudience(null)}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Grupo - Modernizado */}
      <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FolderOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">{editingGroupId ? "Editar Grupo" : "Novo Grupo"}</DialogTitle>
                <DialogDescription>Crie agrupamentos para organizar seus diferentes públicos-alvo.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold text-slate-900">Nome do Grupo *</Label>
              <Input 
                value={groupForm.name} 
                onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                placeholder="Ex: Profissionais CLT buscando renda extra"
                className="h-12 text-lg"
                autoFocus
              />
              <p className="text-xs text-slate-500">Um nome claro para identificar este segmento.</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Descrição / Contexto</Label>
              <Textarea 
                value={groupForm.description} 
                onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                placeholder="Descreva o contexto geral deste grupo para facilitar a organização..."
                className="min-h-[120px] text-base resize-none"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-start gap-3">
              <InfoCard 
                icon={Sparkles} 
                title="Dica" 
                description="Agrupar públicos ajuda a manter a organização quando você tem múltiplas personas ou estratégias diferentes." 
                variant="blue" 
                className="border-0 shadow-none bg-transparent p-0"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" size="lg" onClick={handleGroupClose}>Cancelar</Button>
              <Button onClick={handleGroupSave} disabled={isSavingGroup} size="lg" className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]">
                {isSavingGroup ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : "Salvar Grupo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Seleção de Criação (IA vs Manual) */}
      <Dialog open={showCreationType} onOpenChange={setShowCreationType}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold">Como deseja criar seu público?</DialogTitle>
            <DialogDescription className="text-base">Escolha a melhor forma para definir seu público-alvo agora.</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            {/* Opção Manual */}
            <div 
              onClick={() => { setShowCreationType(false); handleOpen(); }}
              className="group cursor-pointer relative overflow-hidden rounded-xl border-2 border-slate-100 bg-white p-6 hover:border-indigo-600 hover:shadow-xl transition-all duration-300"
            >
              <div className="mb-4 bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Keyboard className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Manualmente</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Preencha os dados do seu público (dores, desejos, hábitos) você mesmo, se já tiver tudo mapeado.
              </p>
              <div className="mt-6 flex items-center text-indigo-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Começar agora <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Opção com IA */}
            <div 
              onClick={() => { setShowCreationType(false); navigate(createPageUrl('AudienceChat')); }}
              className="group cursor-pointer relative overflow-hidden rounded-xl border-2 border-indigo-50 bg-indigo-50/30 p-6 hover:border-pink-500 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 p-3">
                <Badge className="bg-pink-500 hover:bg-pink-600 text-white border-0">Recomendado</Badge>
              </div>
              <div className="mb-4 bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Com Inteligência Artificial</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Converse com nossa IA especialista para descobrir e mapear profundamente seu público-alvo ideal.
              </p>
              <div className="mt-6 flex items-center text-pink-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Iniciar Assistente <Sparkles className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={deleteData.open} 
        onOpenChange={(open) => setDeleteData({ ...deleteData, open })}
        title={deleteData.title}
        description="Esta ação removerá permanentemente este item e não poderá ser desfeita."
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </div>
  );
}