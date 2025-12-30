import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Save, Trash2, Calendar as CalendarIcon, 
  FileText, Settings, Lightbulb, PenLine, CheckCircle, 
  CalendarDays, Rocket
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const STATUS_OPTIONS = [
  { value: 'idea', label: 'Ideia', icon: Lightbulb, color: 'text-amber-500' },
  { value: 'writing', label: 'Em Criação', icon: PenLine, color: 'text-blue-500' },
  { value: 'review', label: 'Revisão', icon: CheckCircle, color: 'text-purple-500' },
  { value: 'scheduled', label: 'Agendado', icon: CalendarDays, color: 'text-indigo-500' },
  { value: 'published', label: 'Publicado', icon: Rocket, color: 'text-emerald-500' },
];

const PLATFORM_OPTIONS = ['Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'YouTube'];
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
];

export default function PostCardModal({ open, onOpenChange, post, postTypes, onSaved }) {
  const { selectedFocusId } = useSelectedFocus();
  const isEditing = post?.id;
  const [isEditingContent, setIsEditingContent] = useState(!post?.id);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    status: 'idea',
    post_type_id: '',
    audience_id: '',
    platform: '',
    priority: 'medium',
    scheduled_date: null,
    notes: ''
  });

  const { data: audiences = [] } = useQuery({
    queryKey: ['audiences', selectedFocusId],
    queryFn: () => base44.entities.Audience.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId
  });

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title || '',
        content: post.content || '',
        status: post.status || 'idea',
        post_type_id: post.post_type_id || '',
        audience_id: post.audience_id || '',
        platform: post.platform || '',
        priority: post.priority || 'medium',
        scheduled_date: post.scheduled_date ? new Date(post.scheduled_date) : null,
        notes: post.notes || ''
      });
      setIsEditingContent(false);
    } else {
      setForm({
        title: '',
        content: '',
        status: 'idea',
        post_type_id: '',
        audience_id: '',
        platform: '',
        priority: 'medium',
        scheduled_date: null,
        notes: ''
      });
      setIsEditingContent(true);
    }
  }, [post]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isEditing) {
        return base44.entities.Post.update(post.id, data);
      }
      return base44.entities.Post.create({ ...data, focus_id: selectedFocusId });
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Postagem atualizada!' : 'Postagem criada!');
      onSaved();
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Post.delete(post.id),
    onSuccess: () => {
      toast.success('Postagem excluída!');
      onSaved();
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    saveMutation.mutate({
      ...form,
      scheduled_date: form.scheduled_date?.toISOString() || null
    });
  };

  const handleDelete = () => {
    setIsConfirmOpen(true);
  };

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === form.status);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-slate-100", currentStatus?.color)}>
              {currentStatus && <currentStatus.icon className="w-5 h-5" />}
            </div>
            {isEditing ? 'Editar Postagem' : 'Nova Postagem'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mx-6 mt-4 grid grid-cols-2 w-fit">
            <TabsTrigger value="content" className="gap-2">
              <FileText className="w-4 h-4" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
            <TabsContent value="content" className="mt-4 space-y-4 flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden">
              {/* Title */}
              <div className="space-y-2">
                <Label>Título / Resumo</Label>
                <Input
                  placeholder="Ex: Post sobre produtividade para CLTs"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                />
              </div>

              {/* Content */}
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center">
                  <Label>Conteúdo / Script</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingContent(!isEditingContent)}
                    className="h-8 text-xs gap-1.5"
                  >
                    {isEditingContent ? (
                      <>
                        <FileText className="w-3 h-3" />
                        Visualizar
                      </>
                    ) : (
                      <>
                        <PenLine className="w-3 h-3" />
                        Editar Conteúdo
                      </>
                    )}
                  </Button>
                </div>
                
                {isEditingContent ? (
                  <Textarea
                    placeholder="Cole aqui o script gerado ou escreva o conteúdo da postagem..."
                    value={form.content}
                    onChange={(e) => updateForm('content', e.target.value)}
                    className="flex-1 min-h-[400px] font-mono text-sm resize-none p-4"
                  />
                ) : (
                  <div className="flex-1 min-h-[400px] border rounded-md p-6 bg-slate-50 overflow-y-auto prose prose-sm max-w-none">
                    {form.content ? (
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-slate-900" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-4 mb-2 text-slate-900" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-bold mt-3 mb-2 text-slate-800" {...props} />,
                          p: ({node, ...props}) => <p className="mb-3 text-slate-700 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-300 pl-4 my-3 italic text-slate-600 bg-slate-100 py-2 rounded-r" {...props} />,
                          code: ({node, inline, ...props}) => inline 
                            ? <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-700" {...props} />
                            : <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-sm my-3"><code {...props} /></pre>,
                        }}
                      >
                        {form.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-slate-400 italic text-center py-10">
                        Nenhum conteúdo ainda. Clique em editar para adicionar.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Anotações, ideias, referências..."
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-4">
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
                      {postTypes?.map(pt => (
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
                      {PLATFORM_OPTIONS.map(p => (
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
                      {audiences?.map(a => (
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
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-6 pt-4 border-t border-slate-100 flex justify-between">
          <div>
            {isEditing && (
              <Button
                variant="ghost"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={isConfirmOpen}
      onOpenChange={setIsConfirmOpen}
      title="Tem certeza que deseja excluir esta postagem?"
      description="Esta ação não pode ser desfeita."
      confirmLabel="Excluir"
      onConfirm={() => deleteMutation.mutate()}
    />
    </>
  );
}