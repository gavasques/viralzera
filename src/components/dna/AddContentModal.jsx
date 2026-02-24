import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import { Video, Music, Youtube, FileText, Upload, Loader2 } from "lucide-react";

export default function AddContentModal({ open, onOpenChange, focusId, onSave }) {
  const [activeTab, setActiveTab] = useState('youtube');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await neon.integrations.Core.UploadFile({ file });
      setUrl(file_url);
      if (!title) setTitle(file.name);
      toast.success('Arquivo enviado!');
    } catch (error) {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Digite um título');
      return;
    }

    const type = activeTab;
    
    if (type === 'text' && !textContent.trim()) {
      toast.error('Digite o conteúdo de texto');
      return;
    }

    if (type !== 'text' && !url.trim()) {
      toast.error('Forneça uma URL ou faça upload de um arquivo');
      return;
    }

    onSave({
      focus_id: focusId,
      type,
      title,
      url: type !== 'text' ? url : '',
      text_content: type === 'text' ? textContent : '',
      transcript: type === 'text' ? textContent : '',
      status: type === 'text' ? 'transcribed' : 'pending'
    });

    // Reset form
    setTitle('');
    setUrl('');
    setTextContent('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Conteúdo para Análise</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="youtube" className="text-xs">
              <Youtube className="w-4 h-4 mr-1" />
              YouTube
            </TabsTrigger>
            <TabsTrigger value="video" className="text-xs">
              <Video className="w-4 h-4 mr-1" />
              Vídeo
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-xs">
              <Music className="w-4 h-4 mr-1" />
              Áudio
            </TabsTrigger>
            <TabsTrigger value="text" className="text-xs">
              <FileText className="w-4 h-4 mr-1" />
              Texto
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome para identificar este conteúdo"
              />
            </div>

            <TabsContent value="youtube" className="mt-0">
              <div>
                <Label>URL do YouTube</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-0">
              <div className="space-y-3">
                <div>
                  <Label>URL do Vídeo ou Upload</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Cole a URL ou faça upload abaixo"
                  />
                </div>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 border-slate-300">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <p className="text-xs text-slate-500">Clique para enviar vídeo</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'video')}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-0">
              <div className="space-y-3">
                <div>
                  <Label>URL do Áudio ou Upload</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Cole a URL ou faça upload abaixo"
                  />
                </div>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 border-slate-300">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <p className="text-xs text-slate-500">Clique para enviar áudio</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={(e) => handleFileUpload(e, 'audio')}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-0">
              <div>
                <Label>Texto (transcrição, post, script, etc.)</Label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Cole aqui o texto que você escreveu..."
                  className="min-h-[150px]"
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}