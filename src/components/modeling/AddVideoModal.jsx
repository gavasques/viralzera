import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Youtube, Plus, Trash2 } from "lucide-react";

function extractYouTubeInfo(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    /youtube\.com\/shorts\/([^&\?\/]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        videoId: match[1],
        thumbnail: `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
      };
    }
  }
  return null;
}

export default function AddVideoModal({ open, onOpenChange, modelingId }) {
  const queryClient = useQueryClient();
  const [videos, setVideos] = useState([{ url: '', title: '', notes: '' }]);

  const createMutation = useMutation({
    mutationFn: async (videosData) => {
      const results = [];
      for (const video of videosData) {
        const info = extractYouTubeInfo(video.url);
        const result = await base44.entities.ModelingVideo.create({
          modeling_id: modelingId,
          url: video.url,
          title: video.title || `Vídeo ${results.length + 1}`,
          video_id: info?.videoId || '',
          thumbnail_url: info?.thumbnail || '',
          notes: video.notes || '',
          status: 'pending'
        });
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Vídeo(s) adicionado(s)!');
      setVideos([{ url: '', title: '', notes: '' }]);
      onOpenChange(false);
    },
    onError: (err) => toast.error('Erro ao adicionar: ' + err.message)
  });

  const addVideo = () => {
    setVideos(prev => [...prev, { url: '', title: '', notes: '' }]);
  };

  const removeVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const updateVideo = (index, field, value) => {
    setVideos(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validVideos = videos.filter(v => v.url.trim() && extractYouTubeInfo(v.url));
    if (validVideos.length === 0) {
      toast.error('Adicione pelo menos uma URL válida do YouTube');
      return;
    }

    createMutation.mutate(validVideos);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            Adicionar Vídeos do YouTube
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {videos.map((video, index) => {
            const info = video.url ? extractYouTubeInfo(video.url) : null;
            
            return (
              <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Vídeo {index + 1}</span>
                  {videos.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500"
                      onClick={() => removeVideo(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>URL do YouTube *</Label>
                  <Input
                    value={video.url}
                    onChange={(e) => updateVideo(index, 'url', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {info && (
                    <div className="flex items-center gap-2 mt-2">
                      <img 
                        src={info.thumbnail} 
                        alt="Thumbnail" 
                        className="w-24 h-auto rounded"
                      />
                      <span className="text-xs text-green-600">✓ URL válida</span>
                    </div>
                  )}
                  {video.url && !info && (
                    <span className="text-xs text-red-500">URL inválida - use um link do YouTube</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Título (opcional)</Label>
                  <Input
                    value={video.title}
                    onChange={(e) => updateVideo(index, 'title', e.target.value)}
                    placeholder="Nome para identificar o vídeo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={video.notes}
                    onChange={(e) => updateVideo(index, 'notes', e.target.value)}
                    placeholder="Observações sobre o vídeo..."
                    className="min-h-[60px]"
                  />
                </div>
              </div>
            );
          })}

          <Button type="button" variant="outline" onClick={addVideo} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar mais um vídeo
          </Button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Youtube className="w-4 h-4 mr-2" />
                  Adicionar Vídeo(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}