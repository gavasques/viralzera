import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, Layers, Youtube, FileText, Plus, Hash, 
  Video, Loader2, PlayCircle, Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CardGridSkeleton } from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import VideoCard from "@/components/modeling/VideoCard";
import TextCard from "@/components/modeling/TextCard";
import AddVideoModal from "@/components/modeling/AddVideoModal";
import AddTextModal from "@/components/modeling/AddTextModal";
import CreatorIdeaEditor from "@/components/modeling/CreatorIdeaEditor";
import TranscriptViewerModal from "@/components/modeling/TranscriptViewerModal";
import ModelingFormModal from "@/components/modeling/ModelingFormModal";

export default function ModelagemDetalhe() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const modelingId = urlParams.get('id');

  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddText, setShowAddText] = useState(false);
  const [showEditModeling, setShowEditModeling] = useState(false);
  const [viewingVideo, setViewingVideo] = useState(null);
  const [transcribingId, setTranscribingId] = useState(null);

  // Fetch modeling
  const { data: modeling, isLoading: loadingModeling } = useQuery({
    queryKey: ['modeling', modelingId],
    queryFn: async () => {
      const results = await base44.entities.Modeling.filter({ id: modelingId });
      return results[0] || null;
    },
    enabled: !!modelingId
  });

  // Fetch videos
  const { data: videos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ['modelingVideos', modelingId],
    queryFn: () => base44.entities.ModelingVideo.filter({ modeling_id: modelingId }, '-created_date', 100),
    enabled: !!modelingId
  });

  // Fetch texts
  const { data: texts = [], isLoading: loadingTexts } = useQuery({
    queryKey: ['modelingTexts', modelingId],
    queryFn: () => base44.entities.ModelingText.filter({ modeling_id: modelingId }, '-created_date', 100),
    enabled: !!modelingId
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: (id) => base44.entities.ModelingVideo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      base44.functions.invoke('modelingTranscribe', { action: 'updateTotals', modelingId }).catch(() => {});
      toast.success('Vídeo excluído!');
    }
  });

  // Delete text mutation
  const deleteTextMutation = useMutation({
    mutationFn: (id) => base44.entities.ModelingText.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingTexts', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      base44.functions.invoke('modelingTranscribe', { action: 'updateTotals', modelingId }).catch(() => {});
      toast.success('Texto excluído!');
    }
  });

  // Transcribe video
  const handleTranscribe = async (videoId) => {
    setTranscribingId(videoId);
    try {
      const response = await base44.functions.invoke('modelingTranscribe', {
        action: 'transcribe',
        videoId
      });
      
      if (response.data.error) throw new Error(response.data.error);
      
      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Transcrição concluída!');
    } catch (error) {
      toast.error('Erro na transcrição: ' + error.message);
    } finally {
      setTranscribingId(null);
    }
  };

  // Transcribe all pending videos
  const handleTranscribeAll = async () => {
    const pendingVideos = videos.filter(v => v.status === 'pending');
    if (pendingVideos.length === 0) {
      toast.info('Nenhum vídeo pendente para transcrever');
      return;
    }

    for (const video of pendingVideos) {
      await handleTranscribe(video.id);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const pendingCount = videos.filter(v => v.status === 'pending').length;
  const transcribedCount = videos.filter(v => v.status === 'transcribed').length;

  if (!modelingId) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Modelagem não encontrada</p>
        <Link to={createPageUrl('Modelagem')}>
          <Button variant="outline">Voltar para Modelagens</Button>
        </Link>
      </div>
    );
  }

  if (loadingModeling) {
    return <CardGridSkeleton count={3} />;
  }

  if (!modeling) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Modelagem não encontrada</p>
        <Link to={createPageUrl('Modelagem')}>
          <Button variant="outline">Voltar para Modelagens</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Modelagem')}>
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-pink-600" />
              {modeling.title}
            </h1>
            {modeling.description && (
              <p className="text-slate-500 text-sm mt-1">{modeling.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline">{modeling.target_platform}</Badge>
              <Badge variant="outline" className="bg-slate-50">{modeling.content_type}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-bold text-slate-900">{formatNumber(modeling.total_tokens_estimate || 0)}</p>
            <p className="text-xs text-slate-500">tokens estimados</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowEditModeling(true)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <Video className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-900">{videos.length}</p>
          <p className="text-xs text-slate-500">Vídeos</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <FileText className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-900">{texts.length}</p>
          <p className="text-xs text-slate-500">Textos</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <Hash className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-900">{formatNumber(modeling.total_characters || 0)}</p>
          <p className="text-xs text-slate-500">Caracteres</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <Hash className="w-5 h-5 text-pink-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-900">{formatNumber(modeling.total_tokens_estimate || 0)}</p>
          <p className="text-xs text-slate-500">~Tokens</p>
        </div>
      </div>

      {/* Creator Idea */}
      <CreatorIdeaEditor modeling={modeling} />

      {/* Tabs */}
      <Tabs defaultValue="videos" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList className="bg-white border border-slate-100">
            <TabsTrigger value="videos" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
              <Youtube className="w-4 h-4 mr-2" />
              Vídeos ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="texts" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <FileText className="w-4 h-4 mr-2" />
              Textos ({texts.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTranscribeAll}
                disabled={transcribingId !== null}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Transcrever Todos ({pendingCount})
              </Button>
            )}
          </div>
        </div>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddVideo(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Vídeo
            </Button>
          </div>

          {loadingVideos ? (
            <CardGridSkeleton count={3} columns={2} />
          ) : videos.length === 0 ? (
            <EmptyState
              icon={Youtube}
              title="Nenhum vídeo adicionado"
              description="Adicione vídeos do YouTube para transcrever e usar como referência"
              actionLabel="Adicionar Vídeo"
              onAction={() => setShowAddVideo(true)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {videos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isTranscribing={transcribingId === video.id}
                  onTranscribe={() => handleTranscribe(video.id)}
                  onView={() => setViewingVideo(video)}
                  onDelete={() => {
                    if (confirm('Excluir este vídeo?')) {
                      deleteVideoMutation.mutate(video.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Texts Tab */}
        <TabsContent value="texts" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddText(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Texto
            </Button>
          </div>

          {loadingTexts ? (
            <CardGridSkeleton count={3} columns={3} />
          ) : texts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum texto adicionado"
              description="Adicione textos de referência, scripts, pesquisas ou notas"
              actionLabel="Adicionar Texto"
              onAction={() => setShowAddText(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {texts.map(text => (
                <TextCard
                  key={text.id}
                  text={text}
                  onView={() => {/* TODO: View text modal */}}
                  onEdit={() => {/* TODO: Edit text */}}
                  onDelete={() => {
                    if (confirm('Excluir este texto?')) {
                      deleteTextMutation.mutate(text.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddVideoModal
        open={showAddVideo}
        onOpenChange={setShowAddVideo}
        modelingId={modelingId}
      />

      <AddTextModal
        open={showAddText}
        onOpenChange={setShowAddText}
        modelingId={modelingId}
      />

      <TranscriptViewerModal
        open={!!viewingVideo}
        onOpenChange={() => setViewingVideo(null)}
        video={viewingVideo}
      />

      <ModelingFormModal
        open={showEditModeling}
        onOpenChange={setShowEditModeling}
        modeling={modeling}
        focusId={modeling?.focus_id}
      />
    </div>
  );
}