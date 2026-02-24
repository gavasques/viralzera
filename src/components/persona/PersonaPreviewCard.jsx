import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, Save, ChevronDown, ChevronUp, Sparkles,
  Target, Heart, Zap, MessageSquare, Lightbulb,
  Shield, Flag, BookOpen, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { neon } from "@/api/neonClient";
import { extractPersonaFromContent } from './personaExtractor';

/**
 * Card para exibir preview da persona gerada e permitir salvar
 */
export default function PersonaPreviewCard({ content, focusId, onSaved }) {
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  // Extrai dados da persona do conteúdo
  const personaData = useMemo(() => {
    return extractPersonaFromContent(content);
  }, [content]);

  if (!personaData) return null;

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!focusId) {
      toast.error('Selecione um foco primeiro');
      return;
    }

    setIsSaving(true);
    try {
      const result = await neon.entities.Persona.create({
        focus_id: focusId,
        ...personaData.normalized
      });
      toast.success('Persona salva com sucesso!');
      onSaved?.(result);
    } catch (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const { raw } = personaData;

  const sections = [
    {
      key: 'quem_sou',
      icon: User,
      title: 'Quem Sou Eu',
      color: 'text-indigo-600 bg-indigo-50',
      content: raw.quem_sou_eu
    },
    {
      key: 'hobbies',
      icon: Heart,
      title: 'Hobbies e Interesses',
      color: 'text-pink-600 bg-pink-50',
      content: raw.hobbies_e_interesses,
      isList: true
    },
    {
      key: 'historia',
      icon: BookOpen,
      title: 'Minha História',
      color: 'text-amber-600 bg-amber-50',
      content: raw.minha_historia_completa
    },
    {
      key: 'anti_heroi',
      icon: Target,
      title: 'O que Odeio (Anti-Herói)',
      color: 'text-red-600 bg-red-50',
      content: raw.o_que_odeio_anti_heroi,
      isList: true
    },
    {
      key: 'habilidades',
      icon: Zap,
      title: 'Habilidades',
      color: 'text-green-600 bg-green-50',
      content: raw.habilidades_o_que_sei_fazer
    },
    {
      key: 'frases',
      icon: MessageSquare,
      title: 'Pensamentos e Frases Marcantes',
      color: 'text-purple-600 bg-purple-50',
      content: raw.pensamentos_e_frases_marcantes
    },
    {
      key: 'tom_voz',
      icon: Sparkles,
      title: 'Tom de Voz',
      color: 'text-cyan-600 bg-cyan-50',
      content: raw.tom_de_voz
    },
    {
      key: 'crencas',
      icon: Lightbulb,
      title: 'Minhas Crenças',
      color: 'text-orange-600 bg-orange-50',
      content: raw.minhas_crencas
    },
    {
      key: 'valores',
      icon: Shield,
      title: 'Valores',
      color: 'text-emerald-600 bg-emerald-50',
      content: raw.valores
    },
    {
      key: 'objetivos',
      icon: Flag,
      title: 'Objetivos',
      color: 'text-blue-600 bg-blue-50',
      content: raw.objetivos
    }
  ].filter(s => s.content);

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 shadow-lg">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b border-indigo-100 bg-white/80 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">{raw.nome || 'Nova Persona'}</h3>
                <p className="text-sm text-slate-500 line-clamp-1">
                  {raw.quem_sou_eu?.substring(0, 80)}...
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving || !focusId}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Persona
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Sections */}
        <ScrollArea className="max-h-[400px]">
          <div className="p-4 space-y-3">
            {sections.map(section => (
              <SectionCard
                key={section.key}
                section={section}
                isExpanded={expandedSections[section.key]}
                onToggle={() => toggleSection(section.key)}
              />
            ))}

            {/* Identidade */}
            {raw.identidade?.length > 0 && (
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <h4 className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Identidade
                </h4>
                <div className="space-y-1">
                  {raw.identidade.map((item, idx) => (
                    <p key={idx} className="text-sm text-slate-600 italic">"{item}"</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function SectionCard({ section, isExpanded, onToggle }) {
  const Icon = section.icon;
  
  const renderContent = () => {
    const { content, isList } = section;
    
    if (!content) return null;

    // Lista simples
    if (isList && Array.isArray(content)) {
      return (
        <ul className="space-y-1 mt-2">
          {content.slice(0, isExpanded ? undefined : 3).map((item, idx) => (
            <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
              {typeof item === 'string' ? item : item.alvo || item.evento || JSON.stringify(item)}
            </li>
          ))}
          {!isExpanded && content.length > 3 && (
            <li className="text-xs text-slate-400">+{content.length - 3} mais...</li>
          )}
        </ul>
      );
    }

    // String simples
    if (typeof content === 'string') {
      return (
        <p className="text-sm text-slate-600 mt-2 line-clamp-3">
          {isExpanded ? content : content.substring(0, 200) + (content.length > 200 ? '...' : '')}
        </p>
      );
    }

    // Objeto com várias propriedades
    if (typeof content === 'object') {
      const entries = Object.entries(content).filter(([_, v]) => v);
      return (
        <div className="space-y-2 mt-2">
          {entries.slice(0, isExpanded ? undefined : 2).map(([key, value]) => (
            <div key={key}>
              <span className="text-xs font-medium text-slate-500 uppercase">
                {key.replace(/_/g, ' ')}
              </span>
              {Array.isArray(value) ? (
                <ul className="mt-1">
                  {value.slice(0, 2).map((v, i) => (
                    <li key={i} className="text-sm text-slate-600">• {typeof v === 'string' ? v : JSON.stringify(v)}</li>
                  ))}
                  {value.length > 2 && <li className="text-xs text-slate-400">+{value.length - 2} mais</li>}
                </ul>
              ) : typeof value === 'object' ? (
                <p className="text-sm text-slate-600">{JSON.stringify(value).substring(0, 100)}...</p>
              ) : (
                <p className="text-sm text-slate-600">{String(value).substring(0, 150)}</p>
              )}
            </div>
          ))}
          {!isExpanded && entries.length > 2 && (
            <p className="text-xs text-slate-400">+{entries.length - 2} categorias...</p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${section.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm text-slate-700">{section.title}</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t border-slate-100">
            {renderContent()}
          </div>
        </CollapsibleContent>
      </div>
      {!isExpanded && (
        <div className="px-3 pb-2">
          {renderContent()}
        </div>
      )}
    </Collapsible>
  );
}