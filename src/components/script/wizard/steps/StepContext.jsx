import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Users } from "lucide-react";
import { WizardCombobox } from "../WizardCombobox";

export function StepContext({ focusId, value, onChange }) {
  // Fetch Personas - with cache optimization
  const { data: personas = [], isLoading: isLoadingPersonas } = useQuery({
    queryKey: ['personas', focusId],
    queryFn: () => base44.entities.Persona.filter({ focus_id: focusId }),
    enabled: !!focusId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false
  });

  // Fetch Audiences & Groups - with cache optimization
  const { data: audiences = [], isLoading: isLoadingAudiences } = useQuery({
    queryKey: ['audiences', focusId],
    queryFn: () => base44.entities.Audience.filter({ focus_id: focusId }),
    enabled: !!focusId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  const { data: audienceGroups = [] } = useQuery({
    queryKey: ['audienceGroups', focusId],
    queryFn: () => base44.entities.AudienceGroup.filter({ focus_id: focusId }),
    enabled: !!focusId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  // Prepare Options (without "none" options)
  const personaOptions = personas?.map(p => ({
    value: p.id,
    label: p.name,
    original: p
  })) || [];

  const audienceOptions = audiences?.map(a => {
    const group = audienceGroups?.find(g => g.id === a.group_id);
    return {
      value: a.id,
      label: a.name,
      searchLabel: `${a.name} ${a.funnel_stage || ''} ${group?.name || ''}`,
      original: { ...a, groupName: group?.name }
    };
  }) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Persona Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Quem vai falar? (Persona)
          </Label>
          <p className="text-sm text-slate-500">
            Define a personalidade, tom de voz e história do autor.
          </p>
        </div>

        {isLoadingPersonas ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <WizardCombobox
            value={value.personaId || ''}
            onChange={(id) => onChange({ ...value, personaId: id })}
            options={personaOptions}
            placeholder="Selecione uma persona..."
            searchPlaceholder="Buscar persona..."
            renderSelected={(p) => p ? (
              <div className="flex flex-col">
                 <span className="font-medium text-slate-900">{p.name}</span>
                 {p.who_am_i && <span className="text-xs text-slate-400 truncate max-w-[300px]">{p.who_am_i}</span>}
              </div>
            ) : null}
          />
        )}
      </div>

      <div className="h-px bg-slate-100" />

      {/* Audience Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Para quem é o conteúdo? (Público)
          </Label>
          <p className="text-sm text-slate-500">
            Foca nas dores e desejos específicos do público selecionado.
          </p>
        </div>

        {isLoadingAudiences ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <WizardCombobox
            value={value.audienceId || ''}
            onChange={(id) => onChange({ ...value, audienceId: id })}
            options={audienceOptions}
            placeholder="Selecione o público..."
            searchPlaceholder="Buscar público..."
            renderOption={(a) => a ? (
               <div className="flex flex-col py-1">
                 <div className="flex items-center gap-2">
                   <span className="font-medium text-slate-900">{a.name}</span>
                   {a.funnel_stage && <Badge variant="outline" className="text-[10px] text-slate-500">{a.funnel_stage}</Badge>}
                 </div>
                 {a.groupName && (
                   <span className="text-[10px] text-slate-400 mt-0.5">Grupo: {a.groupName}</span>
                 )}
               </div>
            ) : null}
            renderSelected={(a) => a ? (
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">{a.name}</span>
                {a.funnel_stage && <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 border-slate-200">{a.funnel_stage}</Badge>}
              </div>
            ) : null}
          />
        )}
      </div>

    </div>
  );
}