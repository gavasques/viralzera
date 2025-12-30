import React, { memo } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { STATUS_OPTIONS, PLATFORMS, PRIORITY_OPTIONS } from "../constants";

function PostFormSettings({ 
  form, 
  updateForm, 
  postTypes = [], 
  audiences = [] 
}) {
  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => updateForm('status', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <opt.icon className={cn("w-4 h-4", opt.color)} />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Post Type & Platform */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Postagem</Label>
          <Select value={form.post_type_id} onValueChange={(v) => updateForm('post_type_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {postTypes.map(pt => (
                <SelectItem key={pt.id} value={pt.id}>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{pt.format}</Badge>
                    {pt.title}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Plataforma</Label>
          <Select value={form.platform} onValueChange={(v) => updateForm('platform', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Priority & Audience */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={form.priority} onValueChange={(v) => updateForm('priority', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Público-Alvo</Label>
          <Select value={form.audience_id} onValueChange={(v) => updateForm('audience_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {audiences.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scheduled Date */}
      <div className="space-y-2">
        <Label>Data de Agendamento</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.scheduled_date ? (
                format(form.scheduled_date, "PPP", { locale: ptBR })
              ) : (
                <span className="text-slate-500">Selecionar data...</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={form.scheduled_date}
              onSelect={(date) => updateForm('scheduled_date', date)}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default memo(PostFormSettings);