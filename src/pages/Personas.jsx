import React, { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User, Plus, Pencil, Trash2, Sparkles, Eye, Mic, Settings, Brain, Keyboard, ChevronRight, Power, EyeOff, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useFocusData } from "@/components/hooks/useFocusData";
import { useEntityCRUD } from "@/components/hooks/useEntityCRUD";
import PageHeader from "@/components/common/PageHeader";
import InfoCard from "@/components/common/InfoCard";
import EmptyState from "@/components/common/EmptyState";
import { ListSkeleton } from "@/components/common/LoadingSkeleton";
import PersonaViewerModal from "@/components/persona/PersonaViewerModal";


const EMPTY_FORM = {
  name: "",
  who_am_i: "",
  skills: "",
  hobbies: "",
  beliefs: "",
  tone_of_voice: "",
  thoughts_phrases: "",
  example_texts: "",
  hatred_list: "",
  story: "",
  values_nao_negociaveis: "",
  values_nao_tolero: "",
  objectives_12m: "",
  objectives_3a: "",
  objectives_10a: "",
  identity: ""
};

export default function Personas() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewingPersona, setViewingPersona] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  
  const [showCreationType, setShowCreationType] = useState(false);
  
  const navigate = useNavigate();

  const { data: personas, isLoading, selectedFocusId } = useFocusData('Persona', 'personas');

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const { save, remove, isSaving } = useEntityCRUD('Persona', 'personas', {
    onSaveSuccess: handleClose,
    saveSuccessMessage: editingId ? "Persona atualizada!" : "Persona criada!",
    deleteSuccessMessage: "Persona removida!"
  });

  const togglePersonaActive = async (persona) => {
    try {
      const newStatus = persona.is_active === false ? true : false;
      await save(persona.id, { ...persona, is_active: newStatus });
      toast.success(newStatus ? "Persona ativada!" : "Persona inativada!");
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
  };

  const togglePersonaDefault = async (persona) => {
    try {
      if (persona.is_default) {
        // Toggle off
        await save(persona.id, { ...persona, is_default: false });
        toast.success("Persona padrão removida!");
      } else {
        // Toggle on - unset others first
        const others = personas.filter(p => p.id !== persona.id && p.is_default);
        await Promise.all(others.map(p => save(p.id, { ...p, is_default: false })));
        
        await save(persona.id, { ...persona, is_default: true });
        toast.success("Persona definida como padrão!");
      }
    } catch (error) {
      toast.error("Erro ao definir padrão");
    }
  };

  // Helper to convert structured data to string for textarea display
  const stringifyField = (field) => {
    if (!field) return "";
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) {
      return field.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join('\n');
    }
    if (typeof field === 'object') {
      if (field.descricao) return field.descricao;
      if (field.habilidades_fortes) return field.habilidades_fortes.join('\n');
      if (field.frases_reais) return field.frases_reais.join('\n');
      // For beliefs - format each category
      const keys = Object.keys(field);
      if (keys.length > 0 && Array.isArray(field[keys[0]])) {
        return keys.map(key => {
          const values = field[key];
          if (Array.isArray(values) && values.length > 0) {
            return `[${key}]\n${values.map(v => `• ${v}`).join('\n')}`;
          }
          return null;
        }).filter(Boolean).join('\n\n');
      }
      return JSON.stringify(field, null, 2);
    }
    return String(field);
  };

  const stringifyToneOfVoice = (tone) => {
    if (!tone) return "";
    if (typeof tone === 'string') return tone;
    let text = "";
    if (tone.descricao) text += tone.descricao + "\n\n";
    if (tone.palavras_e_expressoes_frequentes?.length > 0) {
      text += "Expressões: " + tone.palavras_e_expressoes_frequentes.join(', ') + "\n";
    }
    if (tone.jeito_de_escrever) {
      if (tone.jeito_de_escrever.nivel_de_direto) text += `Direto: ${tone.jeito_de_escrever.nivel_de_direto}\n`;
      if (tone.jeito_de_escrever.humor) text += `Humor: ${tone.jeito_de_escrever.humor}\n`;
    }
    return text.trim();
  };

  const stringifyThoughts = (thoughts) => {
    if (!thoughts) return "";
    if (typeof thoughts === 'string') return thoughts;
    let text = "";
    if (thoughts.frases_reais?.length > 0) {
      text += "[Frases Marcantes]\n" + thoughts.frases_reais.map(f => `"${f}"`).join('\n') + "\n\n";
    }
    if (thoughts.bordoes?.length > 0) {
      text += "[Bordões]\n" + thoughts.bordoes.map(b => `"${b}"`).join('\n');
    }
    return text.trim();
  };

  const stringifyHatredList = (list) => {
    if (!list) return "";
    if (typeof list === 'string') return list;
    if (!Array.isArray(list)) return "";
    return list.map(h => {
      if (typeof h === 'object') {
        let line = h.alvo || "";
        if (h.por_que_me_irrita) line += `\n  ${h.por_que_me_irrita}`;
        if (h.exemplo_real) line += `\n  Ex: ${h.exemplo_real}`;
        return line;
      }
      return h;
    }).join('\n\n');
  };

  const stringifySkills = (skills) => {
    if (!skills) return "";
    if (typeof skills === 'string') return skills;
    if (skills.habilidades_fortes?.length > 0) {
      return skills.habilidades_fortes.map(s => `• ${s}`).join('\n');
    }
    return JSON.stringify(skills, null, 2);
  };

  const stringifyStory = (story) => {
    if (!story) return "";
    if (typeof story === 'string') return story;
    let text = "";
    if (story.origem_e_contexto) text += story.origem_e_contexto + "\n\n";
    if (story.linha_do_tempo?.length > 0) {
      story.linha_do_tempo.forEach(e => {
        text += `• ${e.evento} (${e.idade_ou_periodo})\n`;
        if (e.licao) text += `  Lição: ${e.licao}\n`;
      });
    }
    return text.trim();
  };

  const handleOpen = useCallback((persona = null) => {
    if (persona) {
      setEditingId(persona.id);
      setForm({
        name: persona.name || "",
        who_am_i: persona.who_am_i || "",
        skills: stringifySkills(persona.skills),
        hobbies: Array.isArray(persona.hobbies) ? persona.hobbies.join(', ') : (persona.hobbies || ""),
        beliefs: stringifyField(persona.beliefs),
        tone_of_voice: stringifyToneOfVoice(persona.tone_of_voice),
        thoughts_phrases: stringifyThoughts(persona.thoughts_phrases),
        example_texts: persona.example_texts || "",
        hatred_list: stringifyHatredList(persona.hatred_list),
        story: stringifyStory(persona.story),
        values_nao_negociaveis: persona.values?.nao_negociaveis?.join(', ') || "",
        values_nao_tolero: persona.values?.nao_tolero?.join(', ') || "",
        objectives_12m: persona.objectives?.em_12_meses || "",
        objectives_3a: persona.objectives?.em_3_anos || "",
        objectives_10a: persona.objectives?.em_10_anos || "",
        identity: Array.isArray(persona.identity) ? persona.identity.join('\n') : (persona.identity || "")
      });
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    setIsOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    
    // Parse hatred_list back to array of objects
    const parseHatredList = (text) => {
      if (!text) return [];
      const lines = text.split('\n').filter(l => l.trim());
      const items = [];
      let current = null;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('Ex:') && !trimmed.startsWith('  ')) {
          if (current) items.push(current);
          current = { alvo: trimmed };
        } else if (trimmed.startsWith('Ex:')) {
          if (current) current.exemplo_real = trimmed.replace('Ex:', '').trim();
        } else if (current && !current.por_que_me_irrita) {
          current.por_que_me_irrita = trimmed;
        }
      }
      if (current) items.push(current);
      return items.length > 0 ? items : [{ alvo: text }];
    };

    // Parse beliefs text back to object
    const parseBeliefs = (text) => {
      if (!text) return {};
      const result = {};
      const sections = text.split(/\[([^\]]+)\]/g).filter(Boolean);
      for (let i = 0; i < sections.length; i += 2) {
        const key = sections[i]?.trim();
        const content = sections[i + 1];
        if (key && content) {
          result[key] = content.split('\n')
            .map(l => l.replace(/^[•\*]\s*/, '').trim())
            .filter(Boolean);
        }
      }
      return Object.keys(result).length > 0 ? result : { geral: [text] };
    };

    // Parse tone of voice text back to object
    const parseToneOfVoice = (text) => {
      if (!text) return {};
      const result = { descricao: "" };
      const lines = text.split('\n');
      const descLines = [];
      
      for (const line of lines) {
        if (line.startsWith('Expressões:')) {
          result.palavras_e_expressoes_frequentes = line.replace('Expressões:', '').split(',').map(e => e.trim()).filter(Boolean);
        } else if (line.startsWith('Direto:')) {
          result.jeito_de_escrever = result.jeito_de_escrever || {};
          result.jeito_de_escrever.nivel_de_direto = line.replace('Direto:', '').trim();
        } else if (line.startsWith('Humor:')) {
          result.jeito_de_escrever = result.jeito_de_escrever || {};
          result.jeito_de_escrever.humor = line.replace('Humor:', '').trim();
        } else if (line.trim()) {
          descLines.push(line);
        }
      }
      result.descricao = descLines.join('\n').trim();
      return result;
    };

    // Parse thoughts/phrases text back to object
    const parseThoughts = (text) => {
      if (!text) return {};
      const result = { frases_reais: [], bordoes: [] };
      let currentSection = null;
      
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed === '[Frases Marcantes]') {
          currentSection = 'frases_reais';
        } else if (trimmed === '[Bordões]') {
          currentSection = 'bordoes';
        } else if (trimmed && currentSection) {
          result[currentSection].push(trimmed.replace(/^["']|["']$/g, ''));
        }
      }
      
      if (result.frases_reais.length === 0 && result.bordoes.length === 0) {
        result.frases_reais = text.split('\n').map(l => l.trim()).filter(Boolean);
      }
      return result;
    };

    // Parse skills text back to object
    const parseSkills = (text) => {
      if (!text) return {};
      const skills = text.split('\n').map(l => l.replace(/^[•\-]\s*/, '').trim()).filter(Boolean);
      return { habilidades_fortes: skills };
    };

    // Parse story text back to object
    const parseStory = (text) => {
      if (!text) return {};
      const lines = text.split('\n').filter(l => l.trim());
      const result = { origem_e_contexto: "", linha_do_tempo: [] };
      
      let inTimeline = false;
      const originLines = [];
      
      for (const line of lines) {
        if (line.trim().startsWith('•')) {
          inTimeline = true;
          const match = line.match(/•\s*(.+?)\s*\(([^)]+)\)/);
          if (match) {
            result.linha_do_tempo.push({ evento: match[1], idade_ou_periodo: match[2] });
          }
        } else if (line.trim().startsWith('Lição:') && result.linha_do_tempo.length > 0) {
          result.linha_do_tempo[result.linha_do_tempo.length - 1].licao = line.replace('Lição:', '').trim();
        } else if (!inTimeline) {
          originLines.push(line);
        }
      }
      
      result.origem_e_contexto = originLines.join('\n').trim();
      return result;
    };
    
    // Build the data object with proper structure
    const data = {
      name: form.name,
      who_am_i: form.who_am_i,
      skills: parseSkills(form.skills),
      hobbies: form.hobbies ? form.hobbies.split(',').map(h => h.trim()).filter(Boolean) : [],
      beliefs: parseBeliefs(form.beliefs),
      tone_of_voice: parseToneOfVoice(form.tone_of_voice),
      thoughts_phrases: parseThoughts(form.thoughts_phrases),
      example_texts: form.example_texts,
      hatred_list: parseHatredList(form.hatred_list),
      story: parseStory(form.story),
      values: {
        nao_negociaveis: form.values_nao_negociaveis ? form.values_nao_negociaveis.split(',').map(v => v.trim()).filter(Boolean) : [],
        nao_tolero: form.values_nao_tolero ? form.values_nao_tolero.split(',').map(v => v.trim()).filter(Boolean) : []
      },
      objectives: {
        em_12_meses: form.objectives_12m,
        em_3_anos: form.objectives_3a,
        em_10_anos: form.objectives_10a
      },
      identity: form.identity ? form.identity.split('\n').map(i => i.trim()).filter(Boolean) : []
    };
    
    if (!editingId) {
      data.focus_id = selectedFocusId;
    }
    
    save(editingId, data);
  }, [form, editingId, selectedFocusId, save]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Minha Persona" subtitle="Carregando..." icon={User} />
        <ListSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Minha Persona" 
        subtitle="Defina suas personas e estilos de comunicação"
        icon={User}
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
              <Plus className="w-4 h-4 mr-2" /> Nova Persona
            </Button>
          </div>
        }
      />

      <InfoCard 
        icon={Sparkles}
        title="Por que criar personas?"
        description="Suas personas definem como você se comunica. A IA usará essas informações para criar conteúdo autêntico com seu tom de voz único."
        variant="purple"
      />

      <div className="space-y-4">
        {personas.length === 0 ? (
          <EmptyState 
            icon={User}
            description="Nenhuma persona cadastrada ainda"
            actionLabel="Criar primeira persona"
            onAction={() => handleOpen()}
          />
        ) : (
          personas.filter(p => showInactive || p.is_active !== false).map((persona) => {
            const isStructured = persona.story && typeof persona.story === 'object';
            const toneDescription = persona.tone_of_voice?.descricao || (typeof persona.tone_of_voice === 'string' ? persona.tone_of_voice : null);
            const bordoes = persona.thoughts_phrases?.bordoes || [];
            
            return (
              <Card key={persona.id} className={`hover:shadow-md transition-shadow ${persona.is_active === false ? 'opacity-75 border-slate-300 bg-slate-50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-slate-900">{persona.name}</h3>
                        {isStructured && (
                          <Badge className="bg-indigo-100 text-indigo-700 text-xs">IA</Badge>
                        )}
                        {persona.is_default && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-xs gap-1">
                            <Star className="w-3 h-3 fill-amber-700" /> Padrão
                          </Badge>
                        )}
                      </div>
                      {persona.who_am_i && (
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{persona.who_am_i}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${persona.is_default ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-500'}`}
                        onClick={() => togglePersonaDefault(persona)}
                        title={persona.is_default ? "Remover Padrão" : "Definir como Padrão"}
                      >
                        <Star className={`w-4 h-4 ${persona.is_default ? "fill-amber-500" : ""}`} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${persona.is_active === false ? 'text-slate-400 hover:text-green-600' : 'text-green-600 hover:text-slate-400'}`}
                        onClick={() => togglePersonaActive(persona)}
                        title={persona.is_active === false ? "Ativar" : "Inativar"}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      {isStructured && (
                        <Button variant="ghost" size="icon" onClick={() => setViewingPersona(persona)} title="Ver detalhes">
                          <Eye className="w-4 h-4 text-indigo-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(persona)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => remove(persona.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {persona.is_active === false && (
                    <div className="bg-slate-200 -mx-6 px-6 py-1 mb-4 text-xs text-slate-500 font-medium flex items-center justify-center border-y border-slate-300">
                        <EyeOff className="w-3 h-3 mr-1.5" /> Inativo
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Tom de Voz */}
                    {toneDescription && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                          <Mic className="w-3 h-3" /> Tom de Voz
                        </p>
                        <p className="text-sm text-slate-700 line-clamp-2">{toneDescription}</p>
                      </div>
                    )}
                    
                    {/* Bordões */}
                    {bordoes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Bordões</p>
                        <div className="flex flex-wrap gap-1">
                          {bordoes.slice(0, 5).map((b, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{b}</Badge>
                          ))}
                          {bordoes.length > 5 && (
                            <Badge variant="outline" className="text-xs">+{bordoes.length - 5}</Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Hobbies */}
                    {Array.isArray(persona.hobbies) && persona.hobbies.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Interesses</p>
                        <div className="flex flex-wrap gap-1">
                          {persona.hobbies.slice(0, 3).map((h, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{h}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal Seleção Tipo Criação */}
      <Dialog open={showCreationType} onOpenChange={setShowCreationType}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold">Como deseja criar sua persona?</DialogTitle>
            <DialogDescription className="text-base">Escolha a melhor forma para definir sua persona agora.</DialogDescription>
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
                Preencha os dados da sua persona (história, tom de voz, crenças) você mesmo, se já tiver tudo mapeado.
              </p>
              <div className="mt-6 flex items-center text-indigo-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Começar agora <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Opção com IA */}
            <div 
              onClick={() => { setShowCreationType(false); navigate(createPageUrl('PersonaGenerator')); }}
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
                Converse com nossa IA especialista para criar uma persona profunda e detalhada em poucos minutos.
              </p>
              <div className="mt-6 flex items-center text-pink-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Iniciar Assistente <Sparkles className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <div className="px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingId ? "Editar Persona" : "Nova Persona"}</DialogTitle>
              <DialogDescription>Defina detalhadamente as características da sua persona para guiar a IA.</DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Nome - Full Width */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Nome da Persona *</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="Ex: Mentor Direto, Coach Motivacional"
                className="text-lg py-6"
              />
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Coluna 1 */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Quem Sou Eu (Resumo)</Label>
                  <Textarea 
                    value={form.who_am_i} 
                    onChange={(e) => setForm({...form, who_am_i: e.target.value})}
                    placeholder="Um resumo rápido de quem é você..."
                    className="min-h-[80px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Suas Habilidades (O que sei fazer)</Label>
                  <Textarea 
                    value={form.skills} 
                    onChange={(e) => setForm({...form, skills: e.target.value})}
                    placeholder="Suas habilidades, competências e especialidades..."
                    className="min-h-[100px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Tom de Voz</Label>
                  <Textarea 
                    value={form.tone_of_voice} 
                    onChange={(e) => setForm({...form, tone_of_voice: e.target.value})}
                    placeholder="Como você fala? Gírias, estilo, energia..."
                    className="min-h-[100px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Coluna 2 */}
              <div className="space-y-6">
                 <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Hobbies & Interesses</Label>
                  <Textarea 
                    value={form.hobbies} 
                    onChange={(e) => setForm({...form, hobbies: e.target.value})}
                    placeholder="Separe por vírgula: Leitura, Viagens, Tecnologia..."
                    className="min-h-[100px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Minhas Crenças</Label>
                  <Textarea 
                    value={form.beliefs} 
                    onChange={(e) => setForm({...form, beliefs: e.target.value})}
                    placeholder="Suas crenças, valores e princípios que guiam sua vida..."
                    className="min-h-[100px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">O Que Odeio (Anti-Herói)</Label>
                  <Textarea 
                    value={form.hatred_list} 
                    onChange={(e) => setForm({...form, hatred_list: e.target.value})}
                    placeholder="Um por linha: Falsas promessas, Guru de internet..."
                    className="min-h-[100px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Pensamentos e Frases Marcantes</Label>
                  <Textarea 
                    value={form.thoughts_phrases} 
                    onChange={(e) => setForm({...form, thoughts_phrases: e.target.value})}
                    placeholder="Frases de efeito e pensamentos recorrentes..."
                    className="min-h-[120px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Minha História */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-semibold text-slate-700">Minha História</Label>
              <Textarea 
                value={form.story} 
                onChange={(e) => setForm({...form, story: e.target.value})}
                placeholder="Sua trajetória, de onde veio, momentos marcantes..."
                className="min-h-[120px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

            {/* Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Valores Não Negociáveis</Label>
                <Textarea 
                  value={form.values_nao_negociaveis} 
                  onChange={(e) => setForm({...form, values_nao_negociaveis: e.target.value})}
                  placeholder="Separe por vírgula: Honestidade, Liberdade..."
                  className="min-h-[80px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">O Que Não Tolero</Label>
                <Textarea 
                  value={form.values_nao_tolero} 
                  onChange={(e) => setForm({...form, values_nao_tolero: e.target.value})}
                  placeholder="Separe por vírgula: Mentira, Preguiça..."
                  className="min-h-[80px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Objetivos */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-slate-700">Objetivos</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Em 12 meses</Label>
                  <Textarea 
                    value={form.objectives_12m} 
                    onChange={(e) => setForm({...form, objectives_12m: e.target.value})}
                    placeholder="O que quer alcançar..."
                    className="min-h-[80px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Em 3 anos</Label>
                  <Textarea 
                    value={form.objectives_3a} 
                    onChange={(e) => setForm({...form, objectives_3a: e.target.value})}
                    placeholder="Onde quer estar..."
                    className="min-h-[80px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Em 10 anos</Label>
                  <Textarea 
                    value={form.objectives_10a} 
                    onChange={(e) => setForm({...form, objectives_10a: e.target.value})}
                    placeholder="Visão de longo prazo..."
                    className="min-h-[80px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Identidade */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Frases de Identidade</Label>
              <Textarea 
                value={form.identity} 
                onChange={(e) => setForm({...form, identity: e.target.value})}
                placeholder="Uma frase por linha: Eu sou o tipo de pessoa que..."
                className="min-h-[100px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

            {/* Exemplos de Textos */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-semibold text-slate-700">Exemplos de Textos (Para Calibragem)</Label>
              <Textarea 
                value={form.example_texts} 
                onChange={(e) => setForm({...form, example_texts: e.target.value})}
                placeholder="Cole aqui exemplos de textos reais seus para que a IA aprenda seu estilo exato..."
                className="min-h-[150px] font-mono text-sm bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t sticky bottom-0">
            <Button variant="ghost" onClick={handleClose} className="hover:bg-slate-200">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 px-8">
              {isSaving ? "Salvando..." : "Salvar Persona"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* Viewer Modal */}
      {viewingPersona && (
        <PersonaViewerModal 
          persona={viewingPersona} 
          onClose={() => setViewingPersona(null)} 
        />
      )}
    </div>
  );
}